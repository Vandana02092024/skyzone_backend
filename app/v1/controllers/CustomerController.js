import CommonFunction from "../../../helper/common.js";
import customer from "../models/customer.js";
import { MobileCustomers } from "../../../config/tables.js";
import multer from "multer";
import firebaseService from "../models/firebase.js";

export const updateCustomerProfile = async (req, res) => {
    try {
        const { client_id, device_id, fname, date_of_birth, lname } = req.body;
        const customer_id = CommonFunction.getCustomerId(req, res);
        let resmsg;

        if (!client_id) {
            return res.status(400).json(CommonFunction.errMessage("client Id is required"));
        }

        if (device_id) {
            const updatedDeviceId = await customer.updateDeviceIds(customer_id, device_id, client_id);
            if (updatedDeviceId.status) {
                const topic = "userRegistration";
                await firebaseService.RegisterDeviceId(device_id, topic);
            } else {
                resmsg = "Device id already exists.";
            }
        }
        let updateData;
        let f1 = false;
        if (fname) {
            f1 = true;
            updateData.fname = fname;
        }
        if (date_of_birth) {
            f1 = true;
            updateData.date_of_birth = date_of_birth;
        }
        if (lname) {
            f1 = true;
            updateData.lname = lname;
        }
        if (f1) {
            updateCust = await customer.updateCustomerInfo(updateData, customer_id);
        }
        return res.status(200).json(CommonFunction.succsMessage(resmsg, []));
    } catch (error) {
        console.error("Error updating children:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const updateChildren = async (req, res) => {
    const { children } = req.body;

    if (!Array.isArray(children)) {
        return res.status(400).json({ message: "Children data should be an array" });
    }

    try {
        const updatedChildren = await customer.updateDetails(children);

        if (updatedChildren.length > 0) {
            return res.status(200).json(CommonFunction.succsMessage("success", updatedChildren));
        } else {
            return res.status(400).json(CommonFunction.errMessage("Failed to Update data"));
        }
    } catch (error) {
        console.error("Error updating children:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const deleteChild = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json(CommonFunction.errMessage("ID is required."));
    }

    try {
        const isDeleted = await customer.deleteChild(id);

        if (isDeleted) {
            return res.status(200).json(CommonFunction.succsMessage("Child info deleted successfully!"));
        } else {
            return res.status(200).json(CommonFunction.errMessage("Record not found"));
        }
    } catch (error) {
        console.error("Error deleting child:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const removeUserProfile = async (req, res) => {
    const customer_id = CommonFunction.getCustomerId(req, res);

    if (!customer_id) {
        return res.status(400).json(CommonFunction.errMessage("Custome ID is required."));
    }

    try {
        const isDeleted = await customer.removeUserProfile(customer_id);

        if (isDeleted.code === true) {
            return res.status(200).json(CommonFunction.succsMessage("Customer profile remove successfully."));
        } else {
            return res.status(200).json(CommonFunction.errMessage("Record not found"));
        }
    } catch (error) {
        console.error("Error deleting child:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const searchCustomer = async (req, res) => {
    const { device_id, client_id } = req.query;

    const customer_id = CommonFunction.getCustomerId(req, res);

    if (!customer_id) {
        return res.status(400).json(CommonFunction.errMessage("Customer ID is required."));
    }

    try {
        let customerData = null;
        let data = {};

        if (device_id) {
            customerData = await customer.getCustomerDevice(customer_id, client_id);
        } else {
            if (!client_id) {
                return res.status(400).json(CommonFunction.errMessage("Client ID is required."));
            }

            customerData = await MobileCustomers.findByPk(customer_id);

            if (customerData) {
                // Decrypt sensitive fields
                data.id = customerData?.dataValues?.id;
                data.fname = customerData?.dataValues?.fname;
                data.lname = customerData?.dataValues?.lname;
                data.email = CommonFunction.decrypt(customerData?.dataValues?.email);
                data.phone = CommonFunction.decrypt(customerData?.dataValues?.phone);
                data.profile_picture = CommonFunction.decrypt(customerData?.profile_picture);

                const pointsPromise = customer.getLoyaltyPoints(customer_id, client_id);
                const membershipPromise = customer.getCustomerMembership(customer_id, client_id);
                const childrenPromise = customer.getCustomerChildren(customer_id);
                const childMembershipsPromise = customer.getChildMembership(customer_id, client_id);
                const waiverInfoPromise = customer.getWaiverInfo(customer_id, client_id);
                const [points, membership, children, childMemberships, waiverInfo] = await Promise.all([pointsPromise, membershipPromise, childrenPromise, childMembershipsPromise, waiverInfoPromise]);

                // Add additional data to customer object
                data.reward_points = points?.earned_points;
                data.membership = membership;
                data.children = children;
                data.children_memberships = childMemberships;
                if (waiverInfo.signedWaiverId !== "") {
                    data.waiver_info = waiverInfo;
                }
            }
        }
        if (customerData) {
            return res.status(200).json(CommonFunction.succsMessage("success", data));
        } else {
            return res.status(400).json(CommonFunction.errMessage("There is some issue."));
        }
    } catch (error) {
        console.error("Error searching customer:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const createChildren = async (req, res) => {
    const { children } = req.body;

    const customer_id = CommonFunction.getCustomerId(req, res);

    if (!customer_id) {
        return res.status(400).json(CommonFunction.errMessage("Customer ID is required."));
    }

    try {
        const createdChildren = await customer.createChildren(children, customer_id);

        if (createdChildren.length > 0) {
            return res.status(200).json(CommonFunction.succsMessage("success", createdChildren));
        } else {
            return res.status(400).json(CommonFunction.errMessage("There is some issue."));
        }
    } catch (error) {
        console.log("error in createChildren", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const uploadProfilePicture = (req, res) => {
    const customer_id = CommonFunction.getCustomerId(req, res);

    const storage = multer.memoryStorage(); // Memory storage, adjust as needed
    const upload = multer({ storage: storage }).single("file"); // Expecting 'file' as the field name

    if (!customer_id) {
        return res.status(400).json(CommonFunction.errMessage("Customer ID is required."));
    }

    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error("Multer error:", err);
            return res.status(500).json(CommonFunction.errMessage("File upload failed due to Multer error."));
        } else if (err) {
            // An unknown error occurred when uploading
            console.error("Unknown error:", err);
            return res.status(500).json(CommonFunction.errMessage("File upload failed due to an unknown error."));
        }

        if (!req.file) {
            return res.status(400).json(CommonFunction.errMessage("No file object found."));
        }

        try {
            const result = await customer.uploadProfilePicture(req.file, customer_id);
            return res.json(CommonFunction.succsMessage("Profile picture uploaded successfully.", result));
        } catch (error) {
            console.error("Error in uploadProfilePicture:", error);
            return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
        }
    });
};

export const removeProfilePicture = async (req, res) => {
    const customer_id = CommonFunction.getCustomerId(req, res);
    if (!customer_id) {
        return res.status(400).json(CommonFunction.errMessage("Customer ID is required."));
    }

    try {
        const result = await customer.removeProfilePicture(customer_id);
        return res.json(CommonFunction.succsMessage("Profile picture removed successfully.", result));
    } catch (error) {
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const removeCustomerDevice = async (req, res) => {
    const device_id = req.query.device_id;

    if (!device_id) {
        return res.status(400).json({ message: "Device ID is required" });
    }

    try {
        const deleteResult = await customer.removeCustomerDevice(device_id);

        if (deleteResult) {
            return res.status(200).json(CommonFunction.succsMessage("Device deleted successfully!", deleteResult));
        } else {
            return res.status(200).json(CommonFunction.errMessage("Record not found"));
        }
    } catch (error) {
        return res.status(500).json(CommonFunction.errMessage("Internal server error"));
    }
};

export const CusAccountDelete = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            return res.status(400).json(CommonFunction.errMessage("ID is required."));
        }
        const getAccount = await customer.getAccountUser(id);

        if (getAccount) {
            let email = CommonFunction.encrypt(getAccount?.email);
            const getCustomer = await getCustomerDetailbyEmail(email);
            if (getCustomer) {
                const isDeleted = await customer.removeUserProfile(getCustomer?.id);
                if (isDeleted.code === true) {
                    const Up_Acct = await customer.UpdateAccDetails({ status: "1" }, id);
                    if (Up_Acct) {
                        return res.status(200).json(CommonFunction.succsMessage("Customer profile remove successfully.", getAccount.email));
                    }
                }
            }
        }
        return res.status(200).json(CommonFunction.errMessage("Record not found"));
    } catch (error) {
        console.error("Error in CusAccountDelete:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export const InsertAccountDetails = async (req, res) => {
    try {
        const data = req.body;

        if (!data.email) {
            return res.status(400).json(CommonFunction.errMessage("email is required."));
        }
        if (!data.reason) {
            return res.status(400).json(CommonFunction.errMessage("reason is required."));
        }
        const InsertAccount = await customer.InsertAccount(data);

        if (InsertAccount) {
            return res.status(200).json(CommonFunction.succsMessage("success", InsertAccount));
        } else {
            return res.status(200).json(CommonFunction.errMessage("There is some issue"));
        }
    } catch (error) {
        console.error("Error in InsertAccountDetails:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export default customer;