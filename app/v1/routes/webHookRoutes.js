const router = express.Router();
import express from "express";
import {
    Booking,
    CustomerInsert,
    Redemption
} from "../controllers/WebHookController.js";

router.post('/booking/:location', Booking);
router.post('/customer/:location', CustomerInsert);
router.post('/redemption/:location', Redemption);

export default router;