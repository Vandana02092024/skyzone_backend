const router = express.Router();
import express from "express";
import {
  getAddonsProducts,
  updateProductStatus
} from "../controllers/ProductAvailability.js";
router.get("/get-products", getAddonsProducts);
router.post("/update-product-status", updateProductStatus);
export default router;
