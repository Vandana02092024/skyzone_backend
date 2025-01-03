const router = express.Router();
import express from "express";
import {apiKeyMiddleware, authToken } from '../../../helper/middleware.js';
import MobileCustomers, {
    searchNearbyLocations,
    getCategories,
    getClientDetails,
    getOfferings,
    getAllOfferings,
    getOffersProducts
} from "../controllers/HomeController.js";

import { CusAccountDelete , InsertAccountDetails } from "../controllers/CustomerController.js";

router.get('/search_locations', searchNearbyLocations);
router.get('/categories', getCategories);
router.get('/get_park_details', getClientDetails);
router.get('/offerings/fetch', authToken, getOfferings);
router.get('/offerings/fetch_all', getAllOfferings);
router.get('/offerings/products', getOffersProducts);
router.get('/account-delete-request', CusAccountDelete);
router.post('/insert_account', InsertAccountDetails);

export default router;
