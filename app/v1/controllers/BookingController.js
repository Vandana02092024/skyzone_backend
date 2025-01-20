import CommonFunction from "../../../helper/common.js";
import bookingService from "../models/booking.js";
import rollerUtils from "../../../helper/roller.js";
import s3 from "../../../helper/aws.js";
import QRCode from "qrcode";
import { CreateOrderInFirebase } from "../controllers/RestaurantController.js";

const getBooking = async (req, res) => {
    const { client_id } = req.query;

    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page ? parseInt(req.query.items_per_page) : 10;

    if (!client_id) {
        return res.status(400).json({ message: "Client ID is required." });
    }

    const customer_id = CommonFunction.getCustomerId(req, res);
    if (!customer_id) {
        return res.status(400).json({ message: "Customer ID is required." });
    }

    try {
        const response = await bookingService.getBookings(customer_id, client_id, items_per_page, page);

        const final_response = response.res;
        const total_pages = Math.ceil(response.total / items_per_page);

        const responseData = {
            page: page,
            total_pages: total_pages,
            data: final_response,
        };

        if (responseData) {
            return res.status(200).json(CommonFunction.succsMessage("success", responseData));
        } else {
            return res.status(404).json(CommonFunction.errMessage("No data available"));
        }
    } catch (error) {
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const createBooking = async (req, res) => {
    try {
        const data = req.body;
        const customer_id = await CommonFunction.getCustomerId(req, res);

        // Validate required fields
        if (!data.booking_id) {
            return res.status(400).send("Booking id is required");
        }
        if (!data.payment_status) {
            return res.status(400).send("Payment status is required");
        }
        if (!customer_id) {
            return res.status(400).send("Customer Id is required");
        }

        const booking_id = data.booking_id;
        const pay_status = parseInt(data.payment_status);

        // Fetch booking details
        let booking_detail = await bookingService.getInProcessBooking(booking_id);
        if (!booking_detail) {
            booking_detail = await bookingService.getBooking(booking_id);
            if (!booking_detail) {
                return res.status(400).json(CommonFunction.errMessage(`This booking does not exist in our system: ${booking_id}`));
            } else {
                return res.status(400).json(CommonFunction.errMessage(`This booking has already been processed: ${booking_id}`));
            }
        }
        // Process booking based on payment status
        if (pay_status === 1 || pay_status === 4) {
            // Update booking status

            const booking_items = await bookingService.getBookingItems(booking_id);
            if (customer_id !== booking_detail.customer_id) {
                return res.status(401).json(CommonFunction.errMessage("Not a valid request."));
            }
            if (!booking_items || booking_items.length === 0) {
                return res.status(401).json(CommonFunction.errMessage(`There are no items for this Booking ID: ${booking_id}`));
            }

            // Fetch customer details
            const customer_dt = await bookingService.getCustomerData(customer_id);

            const booking_date = new Date(`${booking_detail.booking_date}T${new Date().toTimeString().split(" ")[0]}.000Z`).toISOString();
            const transaction_date = new Date(booking_detail?.MobileBookingPayments?.payment_date);

            let items = [];

            // Normal booking or membership booking
            for (let value of booking_items) {
                let item = {
                    productId: value.product_id,
                    quantity: value.quantity,
                    bookingDate: booking_detail.booking_date,
                    priceOverride: value.cost,
                };

                if (value.start_time) {
                    item.startTime = value.start_time;
                }

                const packageid = parseInt(value.package_id, 10);
                if (packageid > 0) {
                    item.productId = packageid;
                }

                if (booking_detail.booking_type !== "0" && value.ticket_id) {
                    item.tickets = [{ id: value.ticket_id, name: value.child_name }];
                }

                items.push(item);
            }

            const booking_data = {
                externalId: booking_id,
                name: booking_detail.name,
                comments: booking_detail.comments,
                purchaseDate: booking_date,
                customer: {
                    firstName: customer_dt.fname,
                    lastName: customer_dt.lname,
                    email: CommonFunction.decrypt(customer_dt.email),
                    phone: CommonFunction.decrypt(customer_dt.phone),
                },
                items,
                payments: [
                    {
                        id: booking_detail.payment_id,
                        paymentType: booking_detail?.MobileBookingPayments[0]?.type,
                        amount: booking_detail?.MobileBookingPayments[0]?.amount,
                        creditCardFees: booking_detail?.MobileBookingPayments[0]?.fee,
                        transactionDate: booking_detail?.MobileBookingPayments[0]?.payment_date,
                    },
                ],
                sendConfirmations: true,
            };

            // Handle discounts if applicable
            if (booking_detail.camp_type !== "1") {
                const booking_discounts = await bookingService.getBookingDiscounts(booking_id);
                if (booking_discounts.length > 0) {
                    booking_data.discounts = booking_discounts.map((discount) => ({
                        code: discount.discount_code,
                        amount: discount.amount,
                        percentage: discount.percentage,
                    }));
                }
            }

            if (booking_detail.booking_type === "0") {
                booking_data.capacityReservationId = booking_detail.capacity_reservation_id;
            }
            // Process the booking with the external system (e.g., Roller)
            // const roller = await rollerUtils.getTokenDetails(booking_detail.client_id);
            // const endpoint = "/bookings";
            // const roller_response = await rollerUtils.postRequest(endpoint, roller.accessToken, { booking_data });
            const roller_response = {
                bookingReference:'TESTMODE_V3',
                uniqueId : 'TESTINGMODE_V3'
            }

            if (roller_response.errors) {
                const er_msg = `Roller error: ${roller_response.errors.map((err) => err.message).join(" : ")}`;
                await bookingService.updateBooking(
                    {
                        booking_payload: `${er_msg} | ${JSON.stringify(booking_data)}`,
                    },
                    { booking_id: booking_id }
                );
                await CommonFunction.ApiLogCreate('BookingError', customer_id,roller_response.errors);

                return res.status(400).json(CommonFunction.errMessage(er_msg));
            } else {
                // Generate QR code and upload it to S3
                const code = roller_response.bookingReference;
                let qrCodeBuffer = await QRCode.toBuffer(code, { width: 100 });
                const filename = `${code}.png`;
                const result = await s3
                    .upload({
                        Bucket: process.env.AWS_QRCODE_BUCKET_NAME,
                        Key: filename,
                        Body: qrCodeBuffer,
                        ContentType: "image/png", // MIME type
                        ACL: "public-read",
                    })
                    .promise();

                const fileUrl = `${process.env.AWS_QRCODE_BUCKET_URL}${filename}`;

                // Update booking with Roller response and QR code
                const upData = await bookingService.updateBooking(
                    {
                        status: pay_status,
                        roller_bookingReference: roller_response.bookingReference,
                        roller_uniqueId: roller_response.uniqueId,
                        booking_payload: JSON.stringify(booking_data),
                        booking_qr: `${fileUrl}`,
                    },
                    { booking_id: booking_id }
                );

                if (pay_status === 1 || pay_status === 4) {
                    const fixed = booking_detail.camp_type === "1" ? booking_detail.reward_points : false;
                    await bookingService.addRewardPoints(booking_id, customer_id, booking_detail.client_id, fixed);
                }
                return res.status(200).json(CommonFunction.succsMessage("success", roller_response));
            }
        } else {
            // Handle booking failure and capacity removal
            const uniqueIdToDelete = booking_detail.capacity_reservation_id;
            if (uniqueIdToDelete) {
                const roller = await rollerUtils.getTokenDetails(data.client_id);
                const endpoint = `/capacity-reservation/${uniqueIdToDelete}`;
                const roller_response = await rollerUtils.deleteRequest(endpoint, roller.accessToken);
            }

            await bookingService.updateBooking({ status: pay_status }, { booking_id: booking_id });
            return res.status(401).json(CommonFunction.errMessage("Booking Failed"));
        }
    } catch (error) {
        console.error(error);
        await CommonFunction.ApiLogCreate('BookingError', customer_id,error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

// Restaurent order create

const createBookingForRestaurant = async (req, res) => {
    try {
        const data = req.body;
        const customer_id = await CommonFunction.getCustomerId(req, res);
        // Validate required fields
        if (!data.booking_id) {
            return res.status(401).json(CommonFunction.errMessage("Booking id is required"));
        }
        if (!data.payment_status) {
            return res.status(401).json(CommonFunction.errMessage("Payment status is required"));
        }
        if (!data.payment_date) {
            return res.status(401).json(CommonFunction.errMessage("Payment date is required."));
        }
        if (!customer_id) {
            return res.status(401).json(CommonFunction.errMessage("Customer Id is required."));
        }

        // Sanitize input
        data.booking_id = String(data.booking_id).trim();

        const order_id = (data.order_id = data.booking_id);
        const pay_status = parseInt(data.payment_status);

        let order_detail;

        // Fetch booking details
        order_detail = await bookingService.getInProcessOrder(order_id);
        // CHECK IF ORDER EXISTS //
        if (!order_detail) {
            order_detail = await bookingService.getOrder(order_id);
            if (!order_detail) {
                return res.status(401).json(CommonFunction.errMessage(`This order does not exist in our system: ${order_id}`));
            } else {
                return res.status(401).json(CommonFunction.errMessage(`This order has already been processed: ${order_id}`));
            }
        }
        // PROCESS ORDER //
        if (pay_status && pay_status === 1) {
            if (customer_id != order_detail.customer_id) {
                return res.status(401).json(CommonFunction.errMessage(`Not a valid request.`));
            }
            const ros = await bookingService.realtimeOrderSchema(order_detail);

            if (ros.status) {
                const final_order = ros.schema;
                const insertIntoFirebase = await CreateOrderInFirebase(req, res, final_order);

                if (insertIntoFirebase) {
                    const paymentDate = new Date(data.payment_date);
                    const payment_date = paymentDate.toISOString().slice(0, 19).replace("T", " ");
                    const updateData = await bookingService.updateOrder({ status: pay_status, payment_date: payment_date }, { order_id: order_id });

                    if (pay_status === 1 && updateData) {
                        await bookingService.addRewardPointsForRestroOrder(order_detail.total_cost, customer_id, order_detail.client_id, order_detail.payment_id);
                        return res.status(200).json(CommonFunction.succsMessage("success", final_order));
                    } else {
                        return res.status(401).json(CommonFunction.errMessage("No data avaiable"));
                    }
                } else {
                    return res.status(401).json(CommonFunction.errMessage("Can't create order!"));
                }
            } else {
                return res.status(401).json(CommonFunction.errMessage(ros.message));
            }
        } else {
            await bookingService.updateOrder({ status: pay_status }, { order_id: order_id });
            return res.status(401).json(CommonFunction.errMessage("order Failed!"));
        }
    } catch (error) {
        console.error('error in createBookingForRestaurant', error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const ResolveBooking = async (booking_id, customer_id, payment_status) => {
    try {
        // Validate required fields
        if (!booking_id) {
            return "Booking id is required";
        }
        if (!payment_status) {
            return "Payment status is required";
        }
        if (!customer_id) {
            return "Customer Id is required";
        }
        const pay_status = payment_status;

        // Fetch booking details
        let booking_detail = await bookingService.getInProcessBooking(booking_id);
        if (!booking_detail) {
            booking_detail = await bookingService.getBooking(booking_id);
            if (!booking_detail) {
                return "This booking does not exist in our system";
            } else {
                return `This booking has already been processed: ${booking_id}`;
            }
        }
        // Process booking based on payment status
        if (pay_status === 1 || pay_status === 4) {
            const booking_items = await bookingService.getBookingItems(booking_id);
            if (customer_id !== booking_detail.customer_id) {
                return "Not a valid request.";
            }
            if (!booking_items || booking_items.length === 0) {
                return `There are no items for this Booking ID: ${booking_id}`;
            }

            // Fetch customer details
            const customer_dt = await bookingService.getCustomerData(customer_id);

            const booking_date = new Date(`${booking_detail.booking_date}T${new Date().toTimeString().split(" ")[0]}.000Z`).toISOString();
            const transaction_date = new Date(booking_detail?.MobileBookingPayments?.payment_date);

            let items = [];

            // Normal booking or membership booking
            for (let value of booking_items) {
                let item = {
                    productId: value.product_id,
                    quantity: value.quantity,
                    bookingDate: booking_detail.booking_date,
                    priceOverride: value.cost,
                };

                if (value.start_time) {
                    item.startTime = value.start_time;
                }

                const packageid = parseInt(value.package_id, 10);
                if (packageid > 0) {
                    item.productId = packageid;
                }

                if (booking_detail.booking_type !== "0" && value.ticket_id) {
                    item.tickets = [{ id: value.ticket_id, name: value.child_name }];
                }

                items.push(item);
            }

            const booking_data = {
                externalId: booking_id,
                name: booking_detail.name,
                comments: booking_detail.comments,
                purchaseDate: booking_date,
                customer: {
                    firstName: customer_dt.fname,
                    lastName: customer_dt.lname,
                    email: CommonFunction.decrypt(customer_dt.email),
                    phone: CommonFunction.decrypt(customer_dt.phone),
                },
                items,
                payments: [
                    {
                        id: booking_detail.payment_id,
                        paymentType: booking_detail.type,
                        amount: booking_detail.amount,
                        creditCardFees: booking_detail.fee,
                        transactionDate: transaction_date,
                    },
                ],
                sendConfirmations: true,
            };

            // Handle discounts if applicable
            if (booking_detail.camp_type !== "1") {
                const booking_discounts = await bookingService.getBookingDiscounts(booking_id);
                if (booking_discounts.length > 0) {
                    booking_data.discounts = booking_discounts.map((discount) => ({
                        code: discount.discount_code,
                        amount: discount.amount,
                        percentage: discount.percentage,
                    }));
                }
            }

            if (booking_detail.booking_type === "0") {
                booking_data.capacityReservationId = booking_detail.capacity_reservation_id;
            }
            // Process the booking with the external system (e.g., Roller)
            const roller = await rollerUtils.getTokenDetails(booking_detail.client_id);
            const endpoint = '/bookings';
            const roller_response = await rollerUtils.postRequest(endpoint, roller.accessToken, { booking_data });

            if (roller_response.errors) {
                const er_msg = `Roller error: ${roller_response.errors.map((err) => err.message).join(" : ")}`;
                await bookingService.updateBooking(
                    {
                        booking_payload: `${er_msg} | ${JSON.stringify(booking_data)}`,
                    },
                    { booking_id: booking_id }
                );

                return er_msg;
            } else {
                // Generate QR code and upload it to S3
                const code = roller_response.bookingReference;
                let qrCodeBuffer = await QRCode.toBuffer(code, { width: 100 });
                const filename = `${code}.png`;
                const result = await s3
                    .upload({
                        Bucket: process.env.AWS_QRCODE_BUCKET_NAME,
                        Key: filename,
                        Body: qrCodeBuffer,
                        ContentType: "image/png", // MIME type
                        ACL: "public-read",
                    })
                    .promise();

                const fileUrl = `${process.env.AWS_QRCODE_BUCKET_URL}${filename}`;
                // Update booking with Roller response and QR code
                const upData = await bookingService.updateBooking(
                    {
                        status: pay_status,
                        roller_bookingReference: roller_response.bookingReference,
                        roller_uniqueId: roller_response.uniqueId,
                        booking_payload: JSON.stringify(booking_data),
                        booking_qr: `${fileUrl}`,
                    },
                    { booking_id: booking_id }
                );

                if (pay_status === 1 || pay_status === 4) {
                    const fixed = booking_detail.camp_type === "1" ? booking_detail.reward_points : false;
                    await bookingService.addRewardPoints(booking_id, customer_id, booking_detail.client_id, fixed);
                }
                return "data proceed successfully.";
            }
        } else {
            // Handle booking failure and capacity removal
            const uniqueIdToDelete = booking_detail.capacity_reservation_id;
            if (uniqueIdToDelete) {
                const roller = await rollerUtils.getTokenDetails(booking_detail.client_id);
                const endpoint = `/capacity-reservation/${uniqueIdToDelete}`;
                const roller_response = await rollerUtils.deleteRequest(endpoint, roller.accessToken);
            }

            await bookingService.updateBooking({ status: pay_status }, { booking_id: booking_id });
            return "Booking Failed";
        }
    } catch (error) {
        console.error(error);
        return "Internal Server Error";
    }
};

export { getBooking, createBooking, createBookingForRestaurant, ResolveBooking };