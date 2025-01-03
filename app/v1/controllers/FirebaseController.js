import CommonFunction from "../../../helper/common.js";
import firebaseService from "../models/firebase.js";

// SEND MESSAGE TO A SINGLE DEVICE //
const sendMessageToDevice = async (req, res) => {
    const device_id = req.body.device_id;

    try {
        // MESSAGE BODY
        const message = await firebaseService.notifyMessage(device_id);

        if (message) {
            return message;
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send sending message");
    }
};

// SEND MESSAGE TO A SINGLE DEVICE //
const sendMessageToDeviceTesting = async (req, res) => {
    const device_id = req.body.device_id;

    try {
        // MESSAGE BODY
        const message = await firebaseService.TestNotifyMessage(device_id,res);

        if (message) {
            return message;
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send sending message");
    }
};

// Get DEVICE IDS //
const getDeviceIds = async (req, res) => {
    const email = req.body.email;
    if (!email) {
        return res.status(400).json(CommonFunction.errMessage("Email is required."));
    }
    const en_email = CommonFunction.encrypt(email);

    try {
        // MESSAGE BODY
        const List = await firebaseService.getIdsData(en_email);
        if (List.code) {
            return res.status(200).json(CommonFunction.succsMessage("success", List.data));
        } else {
            return res.status(400).json(CommonFunction.errMessage(List.message));
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send sending message");
    }
};

export { sendMessageToDevice , sendMessageToDeviceTesting , getDeviceIds };