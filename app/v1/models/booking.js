import { Sequelize, Op } from "sequelize";
import moment from "moment";
import {
    MobileCustomers,
    RestProducts,
    CustomerLoyaltyPoints,
    MobileBookings,
    MobileBookingItems,
    MobileBookingPayment,
    ClientMaster,
    MobileBookingDiscounts,
    LoyaltyEarningPoint,
    MobileBookingTickets,
    RestaurantOrder,
    RestaurantOrderItem,
    MobileTransactionFee,
} from "../../../config/tables.js";

const bookingService = {};

bookingService.getBookings = async (customer_id, client_id, items_per_page, page) => {
    try {
        const { count, rows: bookings } = await MobileBookings.findAndCountAll({
            where: {
                client_id,
                customer_id,
                status: { [Op.ne]: "0" },
            },
            include: [
                {
                    model: MobileBookingItems,
                    include: [{ model: RestProducts, attributes: ["name", "imageUrl"] }],
                },
                { model: MobileBookingPayment },
                { model: ClientMaster, attributes: ["client_timezone"] },
            ],
            order: [["created", "DESC"]],
            offset: (page - 1) * items_per_page,
            limit: items_per_page,
        });

        const final_response = bookings.map((booking) => {
            const product_ary = booking.MobileBookingItems.map((item) => ({
                name: item.rest_product?.name,
                imageUrl: item.rest_product?.imageUrl,
                cost: item.cost,
                tax: item.tax,
                quantity: item.quantity,
                start_time: item.start_time,
                end_time: item.end_time,
                comments: item.comments,
            }));
            const payments_arr = booking.MobileBookingPayments.map((payments) => ({
                payment_date: payments?.payment_date,
            }));
            const payment_date = payments_arr.length > 0 ? payments_arr[0].payment_date : "No Payment Date";
            return {
                booking_id: booking?.roller_bookingReference,
                riv_booking_id: booking?.booking_id,
                name: booking?.name,
                total_cost: booking?.total_cost,
                total_quantity: booking?.total_quantity,
                total_discount: booking?.total_discount,
                booking_date: booking?.booking_date,
                status: parseInt(booking?.status) === 1 ? "Payment Successful" : parseInt(booking?.status) === 2 ? "Payment Failed" : parseInt(booking?.status) === 3 ? "Canceled" : "Draft",
                payment_status: booking?.status,
                booking_status: booking?.roller_bookingReference != "" && booking?.roller_uniqueId != "" ? 1 : 0,
                payment_date: payment_date,
                booking_qr: booking?.booking_qr,
                products: product_ary,
            };
        });

        const data = {
            res: final_response,
            total: count,
        };
        return data;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        throw error;
    }
};

// Create Booking Functions

bookingService.getInProcessBooking = async (booking_id) => {
    try {
        const results = await MobileBookings.findOne({
            where: {
                booking_id: booking_id,
                status: { [Sequelize.Op.ne]: "1" },
                roller_bookingReference: null,
                roller_uniqueId: null,
                [Sequelize.Op.or]: [{ payment_id: { [Sequelize.Op.ne]: null } }, { payment_id: { [Sequelize.Op.ne]: "" } }],
            },
            include: [
                {
                    model: MobileBookingPayment,
                    required: false,
                },
            ],
        });

        return results;
    } catch (error) {
        console.error("Error fetching in-process booking: ", error);
        throw new Error("Unable to fetch in-process booking");
    }
};

bookingService.getBooking = async (bookingId, ref = false) => {
    try {
        const whereCondition = ref ? { roller_bookingReference: bookingId } : { booking_id: bookingId };

        const booking = await MobileBookings.findOne({
            attributes: {
                include: [[Sequelize.literal("MobileBookings.type"), "booking_type"]],
            },
            include: [
                {
                    model: MobileBookingPayment,
                    attributes: { exclude: ["booking_id"] },
                },
            ],
            where: whereCondition,
        });

        return booking ? booking.toJSON() : null;
    } catch (error) {
        console.error("Error fetching booking:", error);
        throw error;
    }
};

bookingService.updateBooking = async (updates, where) => {
    try {
        const result = await MobileBookings.update(updates, {
            where: where,
        });
        return result;
    } catch (error) {
        console.error("Error in updateBooking:", error);
        throw error;
    }
};

bookingService.getBookingItems = async (booking_id) => {
    try {
        const bookingItems = await MobileBookingItems.findAll({
            where: { booking_id },
            include: [
                {
                    model: MobileBookingTickets,
                    attributes: ["ticket_id", "child_name"],
                    as: "bookingtickets", // Use the alias if you have defined one
                },
            ],
        });
        return bookingItems;
    } catch (error) {
        console.error("Error fetching booking items:", error);
        throw error;
    }
};

bookingService.getCustomerData = async (customerId) => {
    try {
        // Perform the query using Sequelize
        const customer = await MobileCustomers.findOne({
            attributes: ["fname", "lname", "email", "phone"],
            where: { id: customerId },
        });

        if (!customer) {
            throw new Error("Customer not found");
        }

        return customer;
    } catch (error) {
        console.error("Error fetching customer information:", error);
        throw error;
    }
};

bookingService.getBookingDiscounts = async (booking_id) => {
    try {
        const data = await MobileBookingDiscounts.findAll({
            where: { booking_id: booking_id },
        });
        return data;
    } catch (error) {
        console.error("Error fetching discounts data:", error);
        throw error;
    }
};

bookingService.addRewardPoints = async (booking_id, customer_id, client_id, fixed) => {
    try {
        const bookingDt = await MobileBookings.findOne({
            attributes: ["total_cost", "total_discount", "payment_id"],
            where: { booking_id: booking_id },
        });
        const pointEarned = await LoyaltyEarningPoint.findOne({
            attributes: ["pointEarned", "expire_date", "amountSpent"],
            where: { points_category: 1 },
        });

        let booking_amount = bookingDt.total_cost;
        let point_earnend = (booking_amount / pointEarned.amountSpent) * pointEarned.pointEarned;
        let expire_date;

        if (fixed) {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            point_earnend = fixed + Math.round(point_earnend);
            expire_date = date.toISOString().split("T")[0];
        } else {
            point_earnend = Math.round(point_earnend);
            expire_date = pointEarned.expire_date;
        }

        const result = await CustomerLoyaltyPoints.create({
            transaction_id: bookingDt.payment_id,
            create_date: new Date(),
            customer_id: customer_id,
            client_id: client_id,
            total_payment: booking_amount,
            point_earn: point_earnend,
            point_remaining: point_earnend,
            expire_date: expire_date,
            status: "0",
        });
        return result;
    } catch (error) {
        console.error("Error fetching discounts data:", error);
        throw error;
    }
};

// Restaurant Create Booking functions

bookingService.getInProcessOrder = async (orderId) => {
    try {
        const results = await RestaurantOrder.findOne({
            where: {
                order_id: orderId,
                status: { [Sequelize.Op.ne]: "1" },
                [Sequelize.Op.or]: [{ payment_id: { [Sequelize.Op.ne]: null } }, { payment_id: { [Sequelize.Op.ne]: "" } }],
            },
        });

        return results;
    } catch (error) {
        console.error("Error fetching in-process order: ", error);
        throw new Error("Unable to fetch in-process order");
    }
};

bookingService.getOrder = async (orderId) => {
    try {
        const results = await RestaurantOrder.findOne({
            where: {
                order_id: orderId,
            },
        });

        return results;
    } catch (error) {
        console.error("Error fetching in-process order: ", error);
        throw new Error("Unable to fetch in-process order");
    }
};

const getOrderItems = async (orderId) => {
    const results = await RestaurantOrderItem.findAll({
        where: {
            order_id: orderId,
        },
    });

    return results;
};

bookingService.realtimeOrderSchema = async (order_detail, order_status = "PENDING") => {
    try {
        const order_id = order_detail.order_id;
        const order_items = await getOrderItems(order_id);

        if (!order_items || order_items.length === 0) {
            return { status: false, message: `There are no items for this order ID: ${order_id}` };
        }

        const customer_dt = await MobileCustomers.findOne({
            attributes: ["fname", "lname", "email", "phone"],
            where: { id: order_detail.customer_id },
        });

        const order_date = moment(order_detail.order_date, "YYYY-MM-DD HH:mm:ss").utc();
        const transaction_date = new Date(order_detail.payment_date).toISOString();

        // ORDER ITEMS
        let items = [];
        let order_total_cost = 0;

        order_items.forEach((value) => {
            const line_item_total = value.amount;
            order_total_cost += line_item_total;

            items.push({
                id: value.id,
                product_id: value.product_id,
                category: {
                    id: value.category_id,
                    name: value.category_name,
                },
                name: value.product_name,
                qty: value.quantity,
                cost: value.cost,
                total: value.amount,
            });
        });

        // const transactionFeeDt = await MobileTransactionFee.findOne({
        //     attributes: ["fee"],
        //     where: { id: 1 },
        // });
        // const transactionFee = transactionFeeDt && transactionFeeDt.fee > 0 ? transactionFeeDt.fee : 0.0;

        const final_order = {
            order_path: `orders/${order_detail.client_id}/${order_detail.customer_id}/${order_id}`,
            order_detail: {
                id: order_id,
                customer: {
                    id: order_detail.customer_id,
                    name: `${customer_dt.fname} ${customer_dt.lname}`,
                },
                date: order_date.format("MMM D, YYYY"),
                time: order_date.format("hh:mm A"),
                status: order_status,
                subtotal: order_total_cost,
                tax: 0.0,
                // transactionFee: transactionFee,
                others: 0,
                total: order_detail.total_cost,
                items: items,
                timestamp: Math.floor(new Date(order_date).getTime() / 1000),
                isNotified: false,
            },
        };

        return { status: true, schema: final_order };
    } catch (error) {
        console.error("Error fetching in-process order: ", error);
        throw new Error("Unable to fetch in-process order");
    }
};

bookingService.updateOrder = async (updates, where) => {
    try {
        const result = await RestaurantOrder.update(updates, {
            where: where,
        });
        return result;
    } catch (error) {
        console.error("Error in updateOrder:", error);
        throw error;
    }
};

bookingService.addRewardPointsForRestroOrder = async (order_amount, customer_id, client_id, transaction_id, fixed = false) => {
    try {
        const pointEarned = await LoyaltyEarningPoint.findOne({
            attributes: ["pointEarned", "expire_date", "amountSpent"],
            where: { points_category: 1 },
        });

        let booking_amount = order_amount;
        let point_earnend = (booking_amount / pointEarned.amountSpent) * pointEarned.pointEarned;
        let expire_date;

        if (fixed) {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            point_earnend = fixed + Math.round(point_earnend);
            expire_date = date.toISOString().split("T")[0];
        } else {
            point_earnend = Math.round(point_earnend);
            expire_date = pointEarned.expire_date;
        }

        const result = await CustomerLoyaltyPoints.create({
            transaction_id: transaction_id,
            create_date: new Date(),
            customer_id: customer_id,
            client_id: client_id,
            total_payment: booking_amount,
            point_earn: point_earnend,
            point_remaining: point_earnend,
            expire_date: expire_date,
            status: "0",
        });
        return result;
    } catch (error) {
        console.error("Error fetching discounts data:", error);
        throw error;
    }
};

export default bookingService;