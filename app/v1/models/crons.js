import { Sequelize, Op } from "sequelize";
import moment from "moment";
import { RestProducts, MobileBookings, ClientMaster, Ticket, BookingItems } from "../../../config/tables.js";

const cronService = {};

cronService.getActiveClients = async (whereClause = {}) => {
    try {
        const result = await ClientMaster.findAll({
            attributes: ["client_id"],
            where: {
                status: "1",
                ...whereClause,
            },
        });

        return result; // This will return an array (even if it's empty)
    } catch (error) {
        console.error("Error fetching active clients:", error.message);
        return []; // Return an empty array on error
    }
};

cronService.getActiveClientsUpcomingEvent = async () => {
    try {
        // Construct and execute the query
        const bookings = await MobileBookings.findAll({
            attributes: [
                "booking_id",
                [Sequelize.fn("DATE", Sequelize.literal(`CONVERT_TZ(NOW(), 'UTC', clientmaster.client_timezone)`)), "c_date"],
                [Sequelize.fn("DATE_FORMAT", Sequelize.fn("TIME", Sequelize.literal(`CONVERT_TZ(NOW(), 'UTC', clientmaster.client_timezone)`)), "%H:%i"), "c_time"],
                "customer_id",
            ],
            include: [
                {
                    model: ClientMaster,
                    attributes: [],
                },
            ],
            where: Sequelize.literal("booking_date = DATE(CONVERT_TZ(NOW(), 'UTC', clientmaster.client_timezone))"),
        });

        return bookings;
    } catch (error) {
        console.error("Error fetching active clients:", error);
        return [];
    }
};

cronService.getCustomerMemberships = async (customer_id, client_id) => {
    try {
        const memberships = await Ticket.findAll({
            attributes: [
                [Sequelize.fn("REPLACE", Sequelize.fn("TRIM", Sequelize.fn("LOWER", Sequelize.col("Ticket.name"))), " ", "_"), "customer_name"],
                "ticketId",
                "bookingReference",
                "bookingDate",
                "expiryDate",
                [Sequelize.col("rest_product.name"), "product_name"],
                "productId",
            ],
            include: [
                {
                    model: BookingItems,
                    attributes: [],
                    where: {
                        bookingReference: Sequelize.col("Ticket.bookingReference"),
                        client_id: client_id,
                    },
                },
                {
                    model: RestProducts,
                    attributes: [],
                    where: {
                        Pid: Sequelize.col("Ticket.productId"),
                    },
                },
            ],
            where: {
                productSubType: "Membership",
                expiryDate: {
                    [Op.gte]: Sequelize.fn("CURDATE"),
                },
                "$BookingItem.bookingCustomerId$": {
                    [Op.in]: [
                        Sequelize.literal(`(
                            SELECT c.customerId 
                            FROM mobile_customers mc 
                            INNER JOIN customers c 
                                ON (mc.email = c.email OR c.contactNumber = mc.phone)
                                AND LOWER(TRIM(mc.lname)) = LOWER(TRIM(c.lastName))
                                AND LOWER(TRIM(c.firstName)) = LOWER(TRIM(mc.fname))
                            WHERE c.client_id = ${client_id} 
                            AND mc.id = ${customer_id}
                        )`),
                    ],
                },
            },
            raw: true,
        });
        return memberships.length > 0 ? memberships : [];
    } catch (error) {
        console.error("Error fetching customer memberships:", error);
        throw error;
    }
};

cronService.getUnresolvedBooking = async (whereClause = {}) => {
    try {
        const result = await MobileBookings.findAll({
            // attributes: ['client_id'],
            where: {
                status: "0",
                payment_id: { [Op.ne]: null },
                capacity_reservation_id: { [Op.ne]: null },
                created: {
                    [Op.gte]: moment().subtract(30, "days").startOf("day").toDate(), // Last 10 days
                    [Op.lte]: moment().endOf("day").toDate(), // Up to the current date
                },
            },
        });

        return result; // This will return an array (even if it's empty)
    } catch (error) {
        console.error("Error fetching active clients:", error.message);
        return []; // Return an empty array on error
    }
};

export default cronService;