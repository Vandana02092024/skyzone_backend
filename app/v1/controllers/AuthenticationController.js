import { MobileCustomers, CustomerLoyaltyPoints, LoyaltyEarningPoint } from "../../../config/tables.js";
import { Op } from "sequelize";
import { Sequelize } from "sequelize";
import twilioUtils from "../../../helper/twilio.js";
import CommonFunction from "../../../helper/common.js";
import { generateToken , generateRefreshToken } from "../../../config/jwt.js";

// CRAETE A NEW USER //

const isNull = (value) => value === null || value === undefined || value === "";

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
};

const sanitizeInput = (input) => {
    if (typeof input === "string") {
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return input;
};

const generateCountryCode = (email, testEmails) => {
    return testEmails.includes(email) ? "+91" : "+1";
};

const sendOtp = async (contactMethod, email, testEmails) => {
    const isEmail = isValidEmail(contactMethod);
    const isPhone = isValidPhone(contactMethod);
    let response;

    if (isEmail) {
        response = await twilioUtils.twilio_curl_post({ to: contactMethod }, true);
    } else if (isPhone && isValidPhone(contactMethod)) {
        const countryCode = generateCountryCode(email, testEmails);
        response = await twilioUtils.twilio_curl_post({
            to: `${countryCode}${contactMethod}`,
        });
    } else {
        response = { success: false };
    }

    return response;
};

const addRewardPoints = async (customer_id, client_id) => {
    try {
        const pointData = await LoyaltyEarningPoint.findOne({
            where: { points_category: 2 },
            attributes: ["pointEarned", "expire_date"],
        });

        if (!pointData) {
            throw new Error("No reward points configuration found.");
        }

        const insArry = {
            create_date: new Date(),
            customer_id: customer_id,
            client_id: client_id,
            total_payment: 0,
            point_earn: pointData.pointEarned,
            point_remaining: pointData.pointEarned,
            expire_date: pointData.expire_date,
            status: "0",
        };

        const loyaltyPoints = await CustomerLoyaltyPoints.create(insArry);
        return loyaltyPoints;
    } catch (error) {
        console.error("Error adding reward points:", error);
        throw error;
    }
};

export const createUser = async (req, res) => {
    const body = req.body;

    if (isNull(body.client_id)) {
        return res.status(400).json(CommonFunction.errMessage("Client ID is required."));
    }
    if (isNull(body.phone) || isNull(body.email) || isNull(body.first_name) || isNull(body.last_name)) {
        return res.status(400).json(CommonFunction.errMessage("Invalid input data."));
    }

    if (!isValidEmail(body.email)) {
        return res.status(400).json(CommonFunction.errMessage("Invalid email address."));
    }

    if (!isValidPhone(body.phone)) {
        return res.status(400).json(CommonFunction.errMessage("Phone number is not valid."));
    }

    const en_emailId = CommonFunction.encrypt(body.email);
    const en_phone = CommonFunction.encrypt(body.phone);

    const alreadyCustomer = await MobileCustomers.findOne({
        where: {
            [Sequelize.Op.or]: [{ email: en_emailId }, { phone: en_phone }],
        },
    });

    if (alreadyCustomer) {
        return res.status(400).json(CommonFunction.errMessage("User already exists."));
    }

    const data = {
        fname: body.first_name,
        lname: body.last_name,
        email: en_emailId,
        phone: en_phone,
        client_id: body.client_id,
    };

    try {
        const user = await MobileCustomers.create(data);
        if (user) {
            const dy_emailId = CommonFunction.decrypt(user.email);
            const dy_phone = CommonFunction.decrypt(user.phone);
            // Send OTP
            const testEmails = ["devendra.singh+2@rivette.com", "kuldeep.dev@rivette.com", "archana.manchanda@rivette.com", "deepika.malhotra@rivette.com", "prashant@rivette.com"];
            const countryCode = testEmails.includes(dy_emailId) ? "+91" : "+1";

            let twilioPostData = { to: `${countryCode}${dy_phone}` };

            let twRes = await twilioUtils.twilio_curl_post(twilioPostData);

            if (!twRes.success && isValidEmail(dy_emailId)) {
                twilioPostData = { to: dy_emailId };
                twRes = await twilioUtils.twilio_curl_post(twilioPostData, true);

                if (!twRes.data.success) {
                    return res.status(400).json(CommonFunction.errMessage("Can't send OTP."));
                }
            }

            // Add Reward Points
            await addRewardPoints(user.id, body.client_id);

            return res.status(201).json(
                CommonFunction.succsMessage("User registered successfully.", {
                    id: user.id,
                    username: twilioPostData.to,
                })
            );
        }
        return res.status(201).json(CommonFunction.succsMessage("User created successfully.", user));
    } catch (err) {
        return res.status(400).json(CommonFunction.errMessage(err.message));
    }
};

// verify otp

export const verifyOtp = async (req, res) => {
    const { username, id, otp } = req.body;

    if (!username || !id || !otp) {
        return res.status(400).json(CommonFunction.errMessage("Invalid input data"));
    }

    const sanitizedData = {
        username: sanitizeInput(username),
        id: sanitizeInput(id),
        otp: sanitizeInput(otp),
    };

    try {
        // FETCH CUSTOMER DETAILS
        const response = await MobileCustomers.findOne({
            where: { id: sanitizedData.id },
            attributes: ["phone", "id", "email"],
        });

        if (!response) {
            return res.status(404).json(CommonFunction.errMessage("No record found."));
        }

        const dy_emailId = CommonFunction.decrypt(response.email);
        const dy_phone = CommonFunction.decrypt(response.phone);

        const testEmails = ["devendra.singh+2@actiknow.com", "kuldeep.dev@rivette.com", "archana.manchanda@rivette.com", "deepika.malhotra@rivette.com","kuldeep.dev@webspero.com"];
        let twRes = { success: false };

        if (testEmails.includes(dy_emailId)) {
            twRes.success = true;
        } else {
            // TWILIO OTP
            const twilioPostData = {
                to: sanitizedData.username,
                code: sanitizedData.otp,
            };

            twRes = await twilioUtils.verify_twilio_otp(twilioPostData);
        }

        if (twRes.success || twRes.data.success) {
            const token = generateToken({
                customer_id: response.id,
                phone: dy_phone,
            });
            const refreshToken = generateRefreshToken();
            const data = {
                token: token,
                refreshToken: refreshToken,
            }
            const validUpto = new Date();
            validUpto.setDate(validUpto.getDate() + 60);
            const updateRefreshToken = await MobileCustomers.update({refresh_token:refreshToken,refresh_token_expire:validUpto}, {
                where: {id:response.id},
            });
            if(updateRefreshToken) {
                data.expire_date = validUpto;
                return res.status(200).json(CommonFunction.succsMessage("success", data));
            }
        } else {
            return res.status(400).json(CommonFunction.errMessage("Invalid OTP"));
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

// Token Regenrate by Refresh Token

export const regenrateToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json(CommonFunction.errMessage("Refresh Token is required"));
    }

    const sanitizedData = {
        refreshToken: sanitizeInput(refreshToken),
    };

    try {
        // FETCH CUSTOMER DETAILS
        const response = await MobileCustomers.findOne({
            where: { refresh_token: sanitizedData.refreshToken },
            attributes: ["phone", "id", "email","refresh_token_expire"],
        });

        if (!response) {
            return res.status(404).json(CommonFunction.errMessage("No record found."));
        }
        const currentDate = new Date();
        if (response.refresh_token_expire <= currentDate.getTime()) {
            return res.status(404).json(CommonFunction.errMessage("Your refresh token has expired. Please log in again"));
        }

        const dy_emailId = CommonFunction.decrypt(response.email);
        const dy_phone = CommonFunction.decrypt(response.phone);
            const token = generateToken({
                customer_id: response.id,
                phone: dy_phone,
            });
            const refreshToken = generateRefreshToken();
            const data = {
                token: token,
                refreshToken: refreshToken,
            }
            const validUpto = new Date();
            validUpto.setDate(validUpto.getDate() + 60);
            const updateRefreshToken = await MobileCustomers.update({refresh_token:refreshToken,refresh_token_expire:validUpto}, {
                where: {id:response.id},
            });
            if(updateRefreshToken) {
                data.expire_date = validUpto;
                return res.status(200).json(CommonFunction.succsMessage("success", data));
            }
    } catch (error) {
        console.error("Error in regenrateToken:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

// resend otp

export const resendOtp = async (req, res) => {
    const { username, id } = req.body;

    if (!username || !id) {
        return res.status(400).json(CommonFunction.errMessage("Invalid input data"));
    }

    const sanitizedData = {
        username: sanitizeInput(username),
        id: sanitizeInput(id),
    };

    try {
        // Fetch user details
        const user = await MobileCustomers.findOne({
            where: { id: sanitizedData.id },
            attributes: ["id", "email", "phone"],
        });

        if (!user) {
            return res.status(404).json(CommonFunction.errMessage("No record found."));
        }

        const email = CommonFunction.decrypt(user.email);
        const phone = CommonFunction.decrypt(user.phone);

        const contactMethod = sanitizedData.username;
        const testEmails = ["devendra.singh+2@rivette.com", "kuldeep.dev@rivette.com", "archana.manchanda@rivette.com", "deepika.malhotra@rivette.com", "prashant@rivette.com"];

        // Send OTP
        const otpResponse = await sendOtp(contactMethod, email, testEmails);

        if (otpResponse.data.success) {
            return res.status(200).json(
                CommonFunction.succsMessage("success", {
                    id: user.id,
                    username: otpResponse.to.to,
                })
            );
        } else {
            return res.status(400).json(CommonFunction.errMessage("Unable to send OTP."));
        }
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

// Login Api

export const login = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json(CommonFunction.errMessage("Invalid input data"));
    }

    const req_user = sanitizeInput(username);
    const en_sanitizedUsername = CommonFunction.encrypt(req_user);

    try {
        const user = await MobileCustomers.findOne({
            where: {
                [Op.or]: [{ email: en_sanitizedUsername }, { phone: en_sanitizedUsername }],
            },
            attributes: ["id", "email", "phone"],
        });

        if (!user) {
            return res.status(404).json(CommonFunction.errMessage("User is not registered."));
        }

        const email = CommonFunction.decrypt(user.email);
        const phone = CommonFunction.decrypt(user.phone);

        const testEmails = ["devendra.singh+2@rivette.com", "kuldeep.dev@rivette.com", "archana.manchanda@rivette.com", "deepika.malhotra@rivette.com", "prashant@rivette.com"];

        // Send OTP
        const otpResponse = await sendOtp(req_user, email, testEmails);

        if (otpResponse?.data?.success) {
            // const token = generateToken({ sanitizedUsername }, '1h');
            return res.status(200).json(
                CommonFunction.succsMessage("success", {
                    id: user.id,
                    username: otpResponse.to.to,
                })
            );
        } else {
            let errorMessage = "There is some issue";

            if (otpResponse?.data?.error) {
                errorMessage += ` : ${otpResponse.data.error}`;
            }

            return res.status(400).json(CommonFunction.errMessage(errorMessage));
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json(CommonFunction.errMessage("Internal server error."));
    }
};

export default MobileCustomers;