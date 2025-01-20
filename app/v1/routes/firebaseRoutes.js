const router = express.Router();
import express from "express";
import {
    sendMessageToDevice,
    sendMessageToDeviceTesting,
    RegDeviceInToTopic,
    UnRegDeviceInToTopic
} from "../controllers/FirebaseController.js";

router.post('/send-message-to-device', sendMessageToDevice);
router.post('/send-notify', sendMessageToDeviceTesting);
router.post('/reg-topic', RegDeviceInToTopic);
router.post('/un-reg-topic', UnRegDeviceInToTopic);

export default router;
