const router = express.Router();
import express from "express";
import {apiKeyMiddleware, authToken } from '../../../helper/middleware.js';
import {
    getDiscountProducts,
    generateDiscount,
    QrScanned,
    listScannedQrs
} from "../controllers/RewardsController.js";

router.get('/fetch', getDiscountProducts);
router.post('/generate_discount', generateDiscount);
router.post('/qr_redeemed', QrScanned);
router.get('/redeemed_products', authToken, listScannedQrs);

export default router;
