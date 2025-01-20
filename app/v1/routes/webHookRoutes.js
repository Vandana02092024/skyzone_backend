const router = express.Router();
import express from "express";
import {
    Booking,
    CustomerInsert,
    Redemption
} from "../controllers/WebHookController.js";

router.get('/booking', Booking);
router.post('/customer', CustomerInsert);
router.post('/redemption', Redemption);

export default router;