const router = express.Router();
import express from "express";
import {authToken } from '../../../helper/middleware.js';
import { 
    getBooking,
    createBooking,
} from "../controllers/BookingController.js";

import { 
    PaymentForBooking,
    MembershipBooking,
} from "../controllers/PaymentController.js";

router.get('/fetch', getBooking);
router.post('/payment', authToken , PaymentForBooking);
router.post('/membership_payment', authToken , MembershipBooking);
router.post('/create', authToken , createBooking);

export default router;
