import { Sequelize, Op } from "sequelize";
import {
    CustomerLoyaltyPoints,
    CustomerLoyaltyPointsRedeemed,
    MobileBookings,
    MobileBookingTickets,
    MobileBookingItems,
    MobileBookingPayment,
    MobileBookingMembershipSigned,
    MobileBookingDiscounts,
    MobileCustomerMemberships,
    MobileCustomerChildMemberships,
    MobileCustomerChildren,
    MobileCustomers,
    MobileCustomerStripeKeys,
    Ticket,
    RestProducts,
    SignedWaiver,
    MobileCustomerDeviceIds,
    MobileRolleCustomerMapping,
    AccountDeleteRequests,
} from "../../../config/tables.js";

import s3 from "../../../helper/aws.js";
import fs from "fs";
import path from "path";
import CommonFunction from "../../../helper/common.js";
import dotenv from "dotenv";

dotenv.config();

const customer = {};

customer.updateDeviceIds = async (customer_id, device_id, client_id) => {
    try {
        // Update the record in the MobileCustomerDeviceIds table
        const updateCount = await MobileCustomerDeviceIds.update(
            {
                customer_id: customer_id, // Fields to be updated
                device_id: device_id,
                client_id: client_id,
            },
            {
                where: { customer_id: customer_id, client_id: client_id }, // Condition for the update
            }
        );

        // Check if the update was successful
        if (updateCount) {
            return { success: true, message: "Device ID updated successfully" };
        } else {
            return { success: false, message: "No record found to update" };
        }
    } catch (error) {
        console.error("Error updating device IDs:", error);
        return { success: false, message: "Failed to update device ID", error };
    }
};

customer.updateCustomerInfo = async (updateData, customer_id) => {
    try {
        // Update the record in the MobileCustomerDeviceIds table
        const updateCount = await MobileCustomers.update(updateData, {
            where: { id: customer_id }, // Condition for the update
        });

        // Check if the update was successful
        if (updateCount) {
            return updateCount;
        } else {
            return { success: false, message: "No record found to update" };
        }
    } catch (error) {
        console.error("Error updating device IDs:", error);
        return { success: false, message: "Failed to update device ID", error };
    }
};

customer.updateDetails = async (children) => {
    let updatedChildren = [];

    for (const child of children) {
        const id = parseInt(child.id, 10);
        if (id > 0) {
            const updateData = {};

            if (child.date_of_birth && child.date_of_birth !== "0000-00-00") {
                const aYr = new Date(child.date_of_birth).getFullYear();
                const cYr = new Date().getFullYear();
                const age = cYr - aYr;
                if (age > 0) {
                    updateData.age = age;
                }
                updateData.dob = child.date_of_birth;
            }

            if (child.fname) {
                updateData.fname = child.fname;
            }

            if (child.lname) {
                updateData.lname = child.lname;
            }

            const updateCount = await MobileCustomerChildren.update(updateData, {
                where: { id },
            });

            if (updateCount) {
                const updatedChild = await MobileCustomerChildren.findOne({
                    attributes: ["fname", "lname", ["dob", "date_of_birth"], "age", "customer_id", "id"],
                    where: { id },
                });
                updatedChildren.push(updatedChild);
            }
        }
    }

    return updatedChildren;
};

customer.deleteChild = async (id) => {
    try {
        const result = await MobileCustomerChildren.destroy({
            where: { id },
        });
        return result > 0; // true if a record was deleted
    } catch (error) {
        console.error("Error deleting child:", error);
        return false;
    }
};

customer.removeUserProfile = async (customer_id) => {
    try {
        // 1. Remove customer loyalty points assigned
        await CustomerLoyaltyPoints.destroy({ where: { customer_id } });

        // 2. Remove points redeemed by user
        await CustomerLoyaltyPointsRedeemed.destroy({ where: { customer_id } });

        // 3. Get orders for the customer
        const customer_orders = await MobileBookings.findAll({
            where: { customer_id },
            attributes: [[Sequelize.fn("GROUP_CONCAT", Sequelize.col("booking_id")), "orderids"]],
            raw: true,
        });

        if (customer_orders[0].orderids) {
            const order_ids = customer_orders[0].orderids.split(",");

            // 4. Delete each order's related information
            await MobileBookingTickets.destroy({ where: { booking_id: order_ids } });
            await MobileBookingItems.destroy({ where: { booking_id: order_ids } });
            await MobileBookingPayment.destroy({ where: { booking_id: order_ids } });
            await MobileBookingMembershipSigned.destroy({ where: { booking_id: order_ids } });
            await MobileBookingDiscounts.destroy({ where: { booking_id: order_ids } });
        }

        // 5. Remove membership info
        await MobileCustomerMemberships.destroy({ where: { customer_id } });
        await MobileCustomerChildMemberships.destroy({ where: { customer_id } });

        // 6. Remove customer Stripe info
        await MobileCustomerStripeKeys.destroy({ where: { mob_customer_id: customer_id } });

        // 7. Remove child info
        await MobileCustomerChildren.destroy({ where: { customer_id } });

        // 8. Remove customer itself
        await MobileCustomers.destroy({ where: { id: customer_id } });

        return { code: true, res: customer_id };
    } catch (error) {
        console.error("Error removing customer profile:", error);
        throw error;
    }
};

customer.getCustomerDevice = async (customer_id, client_id) => {
    try {
        result = await MobileCustomerDeviceIds.findOne({
            where: {
                customer_id,
                ...(client_id && { client_id }),
            },
        });

        return result ? result : {};
    } catch (error) {
        console.error("Error fetching Customer Device:", error);
        return {};
    }
};

customer.getLoyaltyPoints = async (customer_id, client_id) => {
    try {
        const result = await CustomerLoyaltyPoints.findOne({
            where: {
                customer_id,
                client_id,
            },
            attributes: [[Sequelize.fn("sum", Sequelize.col("point_remaining")), "earned_points"]],
        });

        return result ? result.get({ plain: true }) : { earned_points: 0 };
    } catch (error) {
        console.error("Error fetching loyalty points:", error);
        return { earned_points: 0 };
    }
};

customer.getCustomerMembership = async (customer_id, client_id) => {
    try {
        const results = await MobileCustomerMemberships.findAll({
            where: {
                customer_id,
                client_id,
                expiry_date: {
                    [Op.gte]: Sequelize.fn("CURDATE"),
                },
            },
            attributes: [
                "customer_id",
                "bookingReference",
                "ticketId",
                "product_id",
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("mobile_customer_memberships.bookingDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "bookingDate"],
                "mebership_qr",
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("mobile_customer_memberships.expiry_date"), "%Y-%m-%dT%H:%i:%s.000Z"), "expiryDate"],
                "client_id",
                "created_at",
                "modified_at",
                "status"
            ],
            include: [
                {
                    model: Ticket,
                    as: "Ticket",
                    attributes: [
                        "name",
                        "ticketId",
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("Ticket.expiryDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "expiryDate"],
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("Ticket.bookingDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "bookingDate"],
                    ],
                    include: [
                        {
                            model: RestProducts,
                            as: "rest_product",
                            attributes: ["name", "Pid"],
                        },
                    ],
                },
            ],
        });
        const data = await Promise.all(
            results.map(async (result) => {
                return {
                    name: result?.Ticket?.name,
                    bookingReference: result?.bookingReference,
                    ticketId: result?.Ticket?.ticketId,
                    expiryDate: result?.Ticket?.expiryDate,
                    bookingDate: result?.Ticket?.bookingDate,
                    qr: result?.mebership_qr,
                    // status: result?.status ===1 ? 'Active' : 'Cancelled',
                    status: result?.status,
                    product_name: result?.Ticket?.rest_product?.name,
                };
            })
        );

        return data;
    } catch (error) {
        console.error("Error fetching customer membership:", error);
        return [];
    }
};

customer.getCustomerChildren = async (customer_id) => {
    try {
        const children = await MobileCustomerChildren.findAll({
            where: {
                customer_id: customer_id,
            },
            attributes: [
                "id",
                "fname",
                "lname",
                "age",
                [Sequelize.literal("dob"), "date_of_birth"],
                "created",
                [Sequelize.literal("`SignedWaivers`.`signedWaiverId`"), "signedWaiverId"],
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("SignedWaivers.expiryDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "expiryDate"],
            ],
            include: [
                {
                    model: SignedWaiver,
                    as: "SignedWaivers",
                    attributes: [], // Don't need to retrieve any attributes from SignedWaiver directly
                    where: {
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("MobileCustomerChildren.lname"))), "=", Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("SignedWaivers.lastName")))),
                            Sequelize.where(Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("MobileCustomerChildren.fname"))), "=", Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("SignedWaivers.firstName")))),
                            Sequelize.where(Sequelize.col("MobileCustomerChildren.dob"), "=", Sequelize.col("SignedWaivers.dateOfBirth")),
                        ],
                    },
                    required: false,
                },
            ],
        });
        return children;
    } catch (error) {
        console.error("Error fetching customer children:", error);
        return [];
    }
};

customer.getChildMembership = async (customer_id, client_id) => {
    try {
        const results = await MobileCustomerChildMemberships.findAll({
            where: {
                customer_id,
                client_id,
                expiry_date: {
                    [Op.gte]: Sequelize.fn("CURDATE"),
                },
            },
            include: [
                {
                    model: Ticket,
                    as: "Ticket",
                    attributes: [
                        "name",
                        "ticketId",
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("Ticket.expiryDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "expiryDate"],
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("Ticket.bookingDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "bookingDate"],
                    ],
                    include: [
                        {
                            model: RestProducts,
                            as: "rest_product",
                            attributes: ["name"],
                        },
                    ],
                },
            ],
        });
        const data = await Promise.all(
            results.map(async (result) => {
                return {
                    name: result?.Ticket?.name,
                    bookingReference: result?.bookingReference,
                    ticketId: result?.Ticket?.ticketId,
                    expiryDate: result?.Ticket?.expiryDate,
                    bookingDate: result?.Ticket?.bookingDate,
                    qr: result?.mebership_qr,
                    status: 1,
                    product_name: result?.Ticket?.rest_product?.name,
                };
            })
        );

        return data;
    } catch (error) {
        console.error("Error fetching child membership:", error);
        return [];
    }
};

customer.getWaiverInfo = async (customer_id, client_id) => {
    try {
        // Fetch the waiver information
        const result = await SignedWaiver.findOne({
            attributes: ["signedWaiverId", [Sequelize.fn("DATE_FORMAT", Sequelize.col("expiryDate"), "%Y-%m-%dT%H:%i:%s.000Z"), "expiryDate"]],
            where: {
                client_id: client_id,
                expiryDate: {
                    [Op.gt]: new Date(), // expiryDate > current date
                },
            },
            include: [
                {
                    model: MobileRolleCustomerMapping,
                    required: true,
                    where: {
                        client_id: client_id,
                    },
                    include: [
                        {
                            model: MobileCustomers,
                            attributes: ["phone", ["phone", "contactNumber"], "fname", "lname", "email"],
                            where: {
                                id: customer_id,
                                client_id: client_id,
                            },
                            required: true,
                        },
                    ],
                },
            ],
            order: [["expiryDate", "DESC"]],
        });
        const data = {
            signedWaiverId: result?.signedWaiverId ? result?.signedWaiverId : "",
            expiryDate: result?.expiryDate ? result?.expiryDate : "",
            contactNumber: result?.mobile_customer?.contactNumber ? CommonFunction.decrypt(result?.mobile_customer?.contactNumber) : "",
            firstName: result?.mobile_customer?.fname ? result?.mobile_customer?.fname : "",
            lastName: result?.mobile_customer?.lname ? result?.mobile_customer?.lname : "",
            email: result?.mobile_customer?.email ? CommonFunction.decrypt(result?.mobile_customer?.email) : "",
        };

        return data;
    } catch (error) {
        console.error("Error fetching waiver info:", error);
        return {};
    }
};

customer.createChildren = async (data, customer_id) => {
    const return_array = [];

    for (const value of data) {
        let id = 0;
        let self = 0;

        if (value.id) id = parseInt(value.id, 10);
        if (value.self) self = parseInt(value.self, 10);

        if (self > 0) {
            const customer = await MobileCustomers.findOne({
                attributes: [
                    "fname",
                    "lname",
                    [Sequelize.fn("DATE_FORMAT", Sequelize.col("dob"), "%Y-%m-%d"), "date_of_birth"],
                    [Sequelize.literal(`YEAR(NOW()) - YEAR(dob) - (DATE_FORMAT(NOW(), '00-%m-%d') < DATE_FORMAT(dob, '00-%m-%d'))`), "age"],
                    [Sequelize.literal(customer_id), "customer_id"],
                    [Sequelize.literal(customer_id), "self_id"],
                    "id",
                ],
                where: { id: customer_id },
            });
            return_array.push(customer);
        } else if (id > 0) {
            const child = await MobileCustomerChildren.findOne({
                attributes: ["fname", "lname", [Sequelize.fn("DATE_FORMAT", sequelize.col("dob"), "%Y-%m-%d"), "date_of_birth"], "age", "customer_id", "id"],
                where: { id },
            });
            return_array.push(child);
        } else {
            const dob = value.date_of_birth ? new Date(value.date_of_birth) : null;
            const age = dob ? new Date().getFullYear() - dob.getFullYear() : 0;

            const newChild = await MobileCustomerChildren.create({
                fname: value.fname,
                lname: value.lname,
                dob,
                age,
                customer_id,
            });

            return_array.push({
                fname: value.fname,
                lname: value.lname,
                date_of_birth: value.date_of_birth,
                age,
                customer_id,
                id: newChild.id,
            });
        }
    }

    return return_array;
};

const getCustomerDetail = async (customer_id) => {
    try {
        const customer = await MobileCustomers.findOne({
            where: {
                id: customer_id,
            },
            attributes: ["id", "email", "fname", "lname", "phone", "profile_picture"],
        });

        if (!customer) {
            throw new Error("Customer not found");
        }

        return customer;
    } catch (error) {
        throw new Error(`Error fetching customer details: ${error.message}`);
    }
};

const updateCustomerInfo = async (data, customer_id) => {
    try {
        await MobileCustomers.update(data, {
            where: {
                id: customer_id,
            },
        });
    } catch (error) {
        throw new Error(`Error updating customer info: ${error.message}`);
    }
};

// upload / update profile picture
customer.uploadProfilePicture = async (file, customer_id) => {
    const filename = `${Date.now()}-${path.basename(file.originalname)}`;

    if (file.size <= 0) {
        throw new Error("File is empty.");
    }
    // Remove previous profile picture if it exists
    const customer = await getCustomerDetail(customer_id);
    if (customer && customer.profile_picture) {
        const url = CommonFunction.decrypt(customer.profile_picture);
        try {
            await s3
                .deleteObject({
                    Bucket: process.env.AWS_PROFILE_BUCKET_NAME,
                    Key: path.basename(url),
                })
                .promise();
        } catch (error) {
            throw new Error(`File Remove error: ${error.message}`);
        }
    }

    // Upload file to S3
    try {
        const fileContent = Buffer.from(file.buffer, "binary");
        const result = await s3
            .upload({
                Bucket: process.env.AWS_PROFILE_BUCKET_NAME,
                Key: filename,
                Body: fileContent,
                ACL: "public-read",
            })
            .promise();

        const fileUrl = `${process.env.AWS_PROFILE_BUCKET_URL}/${filename}`;
        const encfile = CommonFunction.encrypt(fileUrl);

        let updateInfo = await updateCustomerInfo({ profile_picture: encfile }, customer_id);
        if (updateInfo) {
            return { file: encfile };
        } else {
            return {};
        }
    } catch (error) {
        throw new Error(`File upload error: ${error.message}`);
    }
};

customer.removeProfilePicture = async (customer_id) => {
    // Remove previous profile picture if it exists
    const customer = await getCustomerDetail(customer_id);
    if (customer && customer.profile_picture) {
        const url = CommonFunction.decrypt(customer.profile_picture);
        try {
            let deletePr = await s3
                .deleteObject({
                    Bucket: process.env.AWS_PROFILE_BUCKET_NAME,
                    Key: path.basename(url),
                })
                .promise();

            if (deletePr) {
                let updateInfo = await updateCustomerInfo({ profile_picture: "" }, customer_id);
                return "success";
            } else {
                return "failed";
            }
        } catch (error) {
            throw new Error(`File Remove error: ${error.message}`);
        }
    }
};

// Function to remove customer device
customer.removeCustomerDevice = async (device_id) => {
    try {
        const result = await MobileCustomerDeviceIds.destroy({
            where: { device_id },
        });
        return result;
    } catch (error) {
        console.error("Error deleting device:", error);
        throw error;
    }
};

customer.getAccountUser = async (id) => {
    try {
        const result = await AccountDeleteRequests.findOne({
            attributes: ["email"],
            where: { id: id },
        });
        return result;
    } catch (error) {
        console.error("Error in getAccountUser:", error);
        throw error;
    }
};

customer.getCustomerDetailbyEmail = async (email) => {
    try {
        // Find a customer where either the email or phone matches
        const customer = await MobileCustomers.findOne({
            where: {
                [Sequelize.Op.or]: [{ email: email }, { phone: email }],
            },
            attributes: ["id"], // Only return the 'id' attribute
        });

        if (!customer) {
            throw new Error("Customer not found");
        }

        return customer;
    } catch (error) {
        throw new Error(`Error fetching customer details: ${error.message}`);
    }
};

customer.UpdateAccDetails = async (data, id) => {
    try {
        await AccountDeleteRequests.update(data, {
            where: {
                id: id,
            },
        });
    } catch (error) {
        throw new Error(`Error updating customer info: ${error.message}`);
    }
};

customer.InsertAccount = async (data) => {
    try {
        const Insertresult = await AccountDeleteRequests.create({
            email: data.email,
            reason: data.reason,
        });
        return Insertresult;
    } catch (error) {
        console.error("Error in InsertAccount:", error);
        throw error;
    }
};

export default customer;