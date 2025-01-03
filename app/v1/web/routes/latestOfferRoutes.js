const router = express.Router();
import express from "express";
import { authToken } from "../../../../helper/middleware.js";
import { 
    getLatestOfferingsOrder,
    getOfferDetails,
    updateOffer,
    getProductsWithParentInfo,
    AddOffer,
    deleteOfferProduct,
    updateOfferStatus,
    deleteOffer
 } from "../controllers/LatestOfferings.js";
import { uploadFileToS3 } from "../../../../helper/uploadMiddleware.js";
import dotenv from "dotenv";

dotenv.config();

router.get("/list", authToken, getLatestOfferingsOrder);
router.get("/get-offer-details", authToken, getOfferDetails);
router.post("/update", 
    uploadFileToS3("image", process.env.RIVETTE_BUCKET),
    authToken, updateOffer);

router.post("/add", 
        uploadFileToS3("image", process.env.RIVETTE_BUCKET),
        authToken, AddOffer);

router.get("/get-products-parent", authToken, getProductsWithParentInfo);
router.delete("/delete-offer-products", authToken, deleteOfferProduct);
router.post("/update-offer-status", authToken, updateOfferStatus);
router.delete("/delete/:id", authToken, deleteOffer);

export default router;
