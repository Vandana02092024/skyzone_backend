const router = express.Router();
import express from "express";
import {
    getAddons,
    getSingalCard,
    CheckProductAvailability,
    CalculateDiscount
} from "../controllers/ProductsController.js";

router.get('/addons', getAddons);
router.get('/single_card', getSingalCard);
router.get('/product_availability', CheckProductAvailability);
router.post('/discount', CalculateDiscount);

export default router;
