const router = express.Router();
import express from "express";
import { authToken } from "../../../../helper/middleware.js";
import {
  GetPaymentList,
  RefundPayment,
  cancelSubs,
  PaymentDetails,
  stripeIntegration,
} from "../controllers/payment.js";

router.post("/payment-list", authToken, GetPaymentList);
router.post("/refund", authToken, RefundPayment);
router.post("/cancel-sub", authToken, cancelSubs);
router.post("/payment-details", authToken, PaymentDetails);
router.post("/stripe-integration", authToken, stripeIntegration);

export default router;
