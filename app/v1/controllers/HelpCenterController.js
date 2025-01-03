import CommonFunction from "../../../helper/common.js";

import { MobileCustomerQueries, MobileGeneralQueries } from "../../../config/tables.js";

const getCustomerQueries = async (req, res) => {
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let items_per_page = req.query.items_per_page
      ? parseInt(req.query.items_per_page)
      : 10;
    const customerId = CommonFunction.getCustomerId(req, res);

    try {
        const list = await MobileCustomerQueries.findAll({
            where: { customer_id: customerId },
            order: [["created_at", "DESC"]],
            offset: (page - 1) * items_per_page,
            limit: items_per_page,
        });

        const totalRec = await MobileCustomerQueries.count({
            where: { customer_id: customerId },
        });

        const total_pages = Math.ceil(totalRec / items_per_page);

        const finalResponse = {
            data: list,
            page: page,
            total_pages: total_pages,
          };
        if (finalResponse.length > 0) {
            res.status(200).json(CommonFunction.succsMessage("success", finalResponse));
        } else {
            res.status(200).json(CommonFunction.errMessage("No data available"));
        }
    } catch (error) {
        console.log("error in getCustomerQueries", error);
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const addGeneralQuery = async (req, res) => {
    const data = req.body;

    // Mandatory fields validation
    if (!data.subject) return res.status(400).json(CommonFunction.errMessage("Subject is required."));
    if (!data.message) return res.status(400).json(CommonFunction.errMessage("Message is required."));
    if (!data.username) return res.status(400).json(CommonFunction.errMessage("Email or Phone Number is required."));

    // Sanitize input
    const subject = data.subject.trim();
    const message = data.message.trim();
    const username = data.username.trim();

    // Validate email or phone number
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!emailRegex.test(username) && !phoneRegex.test(username)) {
        return res.status(400).send("Not a valid Email or Phone Number.");
    }

    try {
        const result = await MobileGeneralQueries.create({ user: username, subject, message });

        if (result) {
            res.status(200).json(CommonFunction.succsMessage("Query sent successfully.", result));
        } else {
            return res.status(400).json(CommonFunction.errMessage("There is some issue."));
        }
    } catch (error) {
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

const addQuery = async (req, res) => {
    const data = req.body;
    const customerId = CommonFunction.getCustomerId(req, res);

    // Mandatory fields validation
    if (!data.subject) return res.status(400).json(CommonFunction.errMessage("Subject is required."));
    if (!data.message) return res.status(400).json(CommonFunction.errMessage("Message is required."));

    // Sanitize input
    const subject = data.subject.trim();
    const message = data.message.trim();

    try {
        const result = await MobileCustomerQueries.create({ customer_id: customerId, subject, message });

        if (result) {
            res.status(200).json(CommonFunction.succsMessage("Query sent successfully.", result));
        } else {
            return res.status(400).json(CommonFunction.errMessage("There is some issue."));
        }
    } catch (error) {
        return res.status(500).json(CommonFunction.errMessage("Internal Server Error"));
    }
};

export { getCustomerQueries, addGeneralQuery, addQuery };