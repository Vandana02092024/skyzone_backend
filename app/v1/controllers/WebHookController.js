import CommonFunction from "../../../helper/common.js";
import { Webhooks, Customers, BookingItems, Ticket, MembershipRedemptions } from "../../../config/tables.js";

const Booking = async (req, res) => {
    try {
        const details = req.body;
        await Webhooks.create({
            webhook_response: details,
            type: "BOOKING",
        });

        const location = req.params.location ? req.params.location : 1;
        const response = json_decode(details);
        const booking = response.data.booking;
        const bookingItems = response.data.booking.items;

        for (const bookingItem of bookingItems) {
            let customerId = false;
            let sessionStart = "";
            let sessionEnd = "";

            let exists = await BookingItems.findOne({
                where: {
                    bookingItemId: bookingItem.bookingItemId,
                    client_id: location,
                },
            });

            if (exists) {
                await BookingItems.destroy({
                    where: {
                        bookingItemId: bookingItem.bookingItemId,
                        client_id: location,
                    },
                });
            }

            // UPDATE LATER //
            customerId = bookingItem.customerId !== undefined ? bookingItem.customerId : customerId;
            sessionStart = bookingItem.startTime !== undefined ? bookingItem.startTime : sessionStart;
            sessionEnd = bookingItem.endTime !== undefined ? bookingItem.endTime : sessionEnd;
            // UPDATE LATER //

            let createdDate = new Date(bookingItem.createdDate);
            let createdDateFormat = createdDate.toISOString().replace("T", " ").substring(0, 19);

            let bookingCreatedDate = new Date(booking.createdDate);
            let bookingDateFormat = bookingCreatedDate.toISOString().replace("T", " ").substring(0, 19);

            let bookingModifiedDate = new Date(response.eventDate);
            let bookingModifiedDateFormat = bookingModifiedDate.toISOString().replace("T", " ").substring(0, 19);

            await BookingItems.create({
                bookingReference: booking.bookingReference,
                bookingItemId: bookingItem.bookingItemId,
                bookingDate: bookingItem.bookingDate,
                bookingStatus: booking.status,
                bookingLocation: booking.channel,
                productId: bookingItem.productId,
                bookingNotes: booking.comments,
                quantity: bookingItem.quantity,
                groupSize: bookingItem.groupSize,
                createdDate: createdDateFormat,
                bookingCreatedDate: bookingDateFormat,
                bookingModifiedDate: bookingModifiedDateFormat,
                discountAmount: bookingItem.discount,
                cost: bookingItem.cost,
                deviceId: booking.deviceId,
                client_id: location,
            });

            let tickets = bookingItem.tickets;

            for (const ticket of tickets) {
                let exists = await Ticket.findOne({
                    where: {
                        ticketId: bookingItem.bookingItemId,
                        client_id: location,
                    },
                });

                if (exists) {
                    await Ticket.destroy({
                        where: {
                            bookingItemId: ticket.ticketId,
                            client_id: location,
                        },
                    });
                }

                customerId = ticket.customerId !== undefined ? ticket.customerId : customerId ? customerId : "";
                let productSubType = bookingItem.sessionStartTime !== undefined ? "Session" : "Membership";
                let recurringPaymentFrequency = bookingItem.sessionStartTime !== undefined ? "" : "Monthly";

                let bookingDate = new Date(bookingItem.bookingDate).toISOString().substring(0, 10);
                let expiryDate = new Date(bookingItem.bookingEndDate).toISOString().substring(0, 10);

                await Ticket.create({
                    bookingReference: booking.bookingReference,
                    ticketId: ticket.ticketId,
                    name: ticket.name,
                    customerId: customerId,
                    productId: bookingItem.productId,
                    createdDate: createdDateFormat,
                    bookingDate: bookingDate,
                    expiryDate: expiryDate,
                    productType: "Pass",
                    productSubType: productSubType,
                    recurringPaymentFrequency: recurringPaymentFrequency,
                    client_id: location,
                });
            }

            await BookingItems.update({ bookingCustomerId: customerId, sessionStart: sessionStart, sessionEnd: sessionEnd }, { where: { ticketId: tickets.ticketId, client_id: location } });
        }
        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error in Booking:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const CustomerInsert = async (req, res) => {
    try {
        const details = req.body;
        await Webhooks.create({
            webhook_response: details,
            type: "CUSTOMER",
        });

        const location = req.query.location ? req.query.location : 1;
        const response = json_decode(details);
        const customer = response.data.customer;

        let exists = await Customers.findOne({
            where: {
                customerId: customer.customerId,
                client_id: location,
            },
        });

        if (exists) {
            await Customers.destroy({
                where: {
                    customerId: customer.customerId,
                    client_id: location,
                },
            });
        }

        const country = customer?.address?.country !== undefined ? customer?.address?.country : "";

        await BookingItems.create({
            customerId: customer.customerId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: CommonFunction.encrypt(customer.email),
            contactNumber: CommonFunction.encrypt(customer.contactNumber),
            dateOfBirth: customer.dateOfBirth,
            acceptMarketing: customer.acceptMarketing,
            createdDate: new Date(customer.createdDate).toISOString().replace("T", " ").substring(0, 19),
            modifiedDate: new Date(customer.modifiedDate).toISOString().replace("T", " ").substring(0, 19),
            country: country,
            client_id: location,
            createdByMode: "Webhook",
        });

        res.status(200).json({ status: true, message: "Data processed successfully" });
    } catch (error) {
        console.error("Error in CustomerInsert:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const Redemption = async (req, res) => {
    const location = req.params.location || 1;
    const { redemptions } = req.body.data;

    try {
        for (const redemption of redemptions) {
            // Check if the redemption already exists in the database
            const exists = await MembershipRedemptions.findOne({
                where: {
                    ticketId: redemption.ticketId,
                    client_id: location,
                },
            });

            // If it exists, delete it
            if (exists) {
                await MembershipRedemptions.destroy({
                    where: {
                        ticketId: redemption.ticketId,
                        client_id: location,
                    },
                });
            }

            // Prepare data for insertion
            const refAry = redemption.ticketId.split("-");
            await MembershipRedemptions.create({
                redemptionDate: new Date(redemption.redemptionDate).toISOString().replace("T", " ").substring(0, 19),
                bookingReference: refAry[0],
                ticketId: redemption.ticketId,
                client_id: location,
            });
        }

        res.status(200).send({ message: "Redemptions processed successfully." });
    } catch (error) {
        console.error("Error in Redemption:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export { Booking, CustomerInsert, Redemption };