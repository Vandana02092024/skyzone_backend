const router = express.Router();
import express from "express";
import { authToken } from "../../../../helper/middleware.js";
import { FetchLocation , getCustomerQueries , getGeneralQueries } from "../controllers/Home.js";

router.get("/fetch-location", authToken, FetchLocation);
router.get("/customers_queries", authToken, getCustomerQueries);
router.get("/general_queries", authToken, getGeneralQueries);

export default router;
