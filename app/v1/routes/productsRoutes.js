const router = express.Router();
import express from "express";
import { authToken } from "../../../helper/middleware.js";
import {
    getAddons,
    getSingalCard,
    CheckProductAvailability,
    CalculateDiscount
} from "../controllers/ProductsController.js";

router.get('/addons', getAddons);
router.get('/single_card', getSingalCard);
router.get('/product_availability', CheckProductAvailability);
router.post('/discount',authToken, CalculateDiscount);

export default router;
