import stripe from "../../../../helper/stripe.js";
import CommonFunction from "../../../../helper/common.js";
import { findMobileBooking, getClientDetail, getStripeId, updateMobileBooking } from "../models/payments.js";
import dotenv from "dotenv";
import { findSingleUser } from "../models/user.js";

// CONFIG
dotenv.config();

// GET CLIENT PAYMENTS //
export const GetPaymentList = async (req, res) => {
    const StartDate = req.query.start_date;
    const EndDate = req.query.end_date;

    if (StartDate && EndDate) {
        const startDate = new Date(StartDate);
        const endDate = new Date(EndDate);

        // Calculate the difference in months
        const diffInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

        if (diffInMonths > 2 || (diffInMonths === 2 && endDate.getDate() > startDate.getDate())) {
            return res.status(200).json(CommonFunction.errMessage("You can only get data for a maximum of two months."));
        }
    }

    try {
        let page = req.query.page ? parseInt(req.query.page) : 1;
        let items_per_page = req.query.page_size ? parseInt(req.query.page_size) : 5000;
        const location_id = req.query.location_id ? req.query.location_id : "1";
        const clientDt = await getStripeId(location_id);

        if (clientDt.code) {
            const stripeUserId = clientDt.res.stripe_account_id;
            const condition = { limit: items_per_page };
            let sum = 0;

            if (req.query.start_date) {
                const startDate = Math.floor(new Date(req.query.start_date).getTime() / 1000);
                condition.created = { gte: startDate };
            } else {
                // Default to the start of the current date
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const startDate = Math.floor(currentDate.getTime() / 1000);
                condition.created = { gte: startDate };
            }
            if (req.query.end_date) {
                const endDate = new Date(req.query.end_date);
                endDate.setHours(23, 59, 59, 999);
                const endDateTimestamp = Math.floor(endDate.getTime() / 1000);
                condition.created = { ...condition.created, lte: endDateTimestamp };
            } else {
                // Default to the end of the current date
                const currentDate = new Date();
                currentDate.setHours(23, 59, 59, 999);
                const endDateTimestamp = Math.floor(currentDate.getTime() / 1000);
                condition.created = { ...condition.created, lte: endDateTimestamp };
            }

            try {
                const allChargesListNew = await stripe.charges.list(condition, {
                    stripeAccount: stripeUserId,
                });

                for await (const charge of allChargesListNew.data) {
                    if (charge.status === "succeeded") {
                        const amtSum = (charge.amount - charge.application_fee_amount) / 100;
                        sum += amtSum;
                    }
                }

                sum = `$${sum.toFixed(2)}`;

                if (req.query.pn) {
                    condition.starting_after = Buffer.from(req.query.pn, "base64").toString("utf-8");
                }

                if (req.query.pp) {
                    condition.ending_before = Buffer.from(req.query.pp, "base64").toString("utf-8");
                }

                const allChargesList = await stripe.charges.list(condition, {
                    stripeAccount: stripeUserId,
                });

                const allCharges = allChargesList.data;
                let count = 0;
                let allFirstId, allLastId;

                for await (const charge of allChargesListNew.data) {
                    allLastId = charge.id;
                    count++;

                    if (count === 1) {
                        allFirstId = charge.id;
                        break;
                    }
                }

                const AllData = await Promise.all(
                    allCharges.map(async (item) => {
                        try {
                            const customerId = item.customer;
                            const description = item.description;

                            const customer = await stripe.customers.retrieve(customerId, {
                                stripeAccount: stripeUserId,
                            });

                            const select = ["capacity_reservation_id", "booking_id", "membership_cancelled"];
                            const where = {
                                booking_id: description,
                                type: "1",
                            };
                            const bookingDt = await findMobileBooking(select, where);

                            if (bookingDt.code)
                                return {
                                    result: item,
                                    bookingDt: bookingDt.res,
                                    customer_name: customer.name,
                                    customer_email: customer.email,
                                };
                            else {
                                return {
                                    result: item,
                                    customer_name: customer.name ?customer.name:'N/A',
                                    customer_email: customer.email ? customer.email : 'N/A',
                                };
                            }
                        } catch (error) {
                            return {
                                result: item,
                                customer_name: "Unknown",
                                customer_email: "Unknown",
                                error: error.message,
                            };
                        }
                    })
                );

                res.status(200).json({
                    message: "success",
                    data: AllData,
                    sum,
                    allFirstId,
                    allLastId,
                });
            } catch (error) {
                res.status(500).json(CommonFunction.errMessage("An error occurred while fetching charges."));
            }
        }
    } catch (error) {
        res.status(400).json(CommonFunction.errMessage(error.message));
    }
};

// REFUND CUSTOMER PAYMENT
export const RefundPayment = async (req, res) => {
    try {
        const charge_id = req.body.charge_id;
        const amount = req.body.amount;

        const location_id = req.body.location_id ? req.body.location_id : "";
        const clientDt = await getStripeId(location_id);

        if (clientDt.code) {
            const stripeUserId = clientDt?.res?.stripe_account_id;

            const refund = await stripe.refunds.create(
                {
                    charge: charge_id,
                    amount: amount,
                },
                { stripeAccount: stripeUserId }
            );

            if (refund.id) {
               return res.status(200).json(CommonFunction.succsMessage("Refund initiated successfully.", refund));
            } else {
              return res.status(200).json(CommonFunction.infoMessage("Faild to refund."));
            }
        } else {
          return res.status(400).json(CommonFunction.errMessage("Client does not exist."));
        }
    } catch (error) {
        console.log(error);
       return res.status(500).json(CommonFunction.errMessage(error.message));
    }
};

// CANCEL SUBSCRIPTION
export const cancelSubs = async (req, res) => {
    try {
        const id = Buffer.from(req.body.id, "base64").toString("utf-8");

        const location_id = req.body.location_id ? req.body.location_id : "";
        const clientDt = await getStripeId(location_id);

        if (clientDt.code) {
            const stripeUserId = clientDt.res.stripe_account_id;
            const subscription = await stripe.subscriptions.retrieve(id, {
                stripeAccount: stripeUserId,
            });

            const canceledSubscription = await stripe.subscriptions.cancel(id, {
                stripeAccount: stripeUserId,
            });

            if (canceledSubscription.status === "") {
                const booking_id = req.body.booking_id;

                const upRecord = { membership_cancelled: "1" };
                const where = { booking_id: booking_id };
                const dt = await updateMobileBooking(upRecord, where);
              return res.status(200).json(CommonFunction.succsMessage('success',refund));
            } else {
                return res.status(400).json(CommonFunction.errMessage('Failed'));
            }
        } else {
          return res.status(400).json(CommonFunction.errMessage('There is some issue while fetching records.'));
        }
    } catch (error) {
      return res.status(500).json(CommonFunction.errMessage(error.message));
    }
};

// GET PAYMENT DETAIL
export const PaymentDetails = async (req, res) => {
    try {
        const payout_id = req.body.id;

        const location_id = req.body.location_id ? req.body.location_id : "";
        const clientDt = await getStripeId(location_id);

        if (clientDt.code) {
            const stripeUserId = clientDt.res.stripe_account_id;
            const payout_details = await stripe.charges.retrieve(payout_id, {
                expand: ["source.three_d_secure.card"],
                stripeAccount: stripeUserId,
            });

            if (payout_details) {
                return res.status(200).json(CommonFunction.succsMessage("Success", payout_details));
            } else {
                return res.status(400).json(CommonFunction.errMessage("Failed"));
            }
        } else {
            return res.status(400).json(CommonFunction.errMessage("Client does not exist."));
        }
    } catch (error) {
        console.log("error", error);
        return res.status(500).json(CommonFunction.errMessage(error.message));
    }
};

// WEB STRIPE ITEGRATION
export const stripeIntegration = async (req, res) => {
    const role = req.user.role;
    const user_id = req.user.user_id;

    //  Not Admin user
    if (role && role !== 1) {
        const userDt = await findSingleUser(["client_id"], {
            id: req.user.user_id,
        });

        if (!userDt.code) {
            res.status(400).json(CommonFunction.errMessage("Your are not a valid user!"));
        }

        var results = await getClientDetail({
            client_id: userDt.res.client_id,
            status: "1",
        });
    } else {
        var results = await getClientDetail({ status: "1" });
    }

    if (results.code) {
        const data = results?.res?.map(async (result) => {
            let accountId = result?.stripe_account_id;
            let account = await stripe.accounts.retrieve(accountId);
            let loginLink = {};

            if (account.type === "express") {
                try {
                    loginLink = await stripe.accounts.createLoginLink(accountId);
                } catch (error) {
                    loginLink.url = "";
                }
            }

            let url = loginLink?.url;
            const Arry = {
                id: result?.client_id,
                client_name: result?.client_name,
                location: result?.location,
                address: result?.address,
                url: url ? url : "",
            };
            return Arry;
        });
        const response = await Promise.all(data);
        return res.status(200).json(CommonFunction.succsMessage("success", response));
    }
};