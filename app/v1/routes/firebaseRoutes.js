const router = express.Router();
import express from "express";
import {
    sendMessageToDevice,
    sendMessageToDeviceTesting
} from "../controllers/FirebaseController.js";

router.post('/send-message-to-device', sendMessageToDevice);
router.post('/send-notify', sendMessageToDeviceTesting);

export default router;
