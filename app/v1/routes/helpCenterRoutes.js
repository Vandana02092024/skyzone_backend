const router = express.Router();
import express from "express";
import {
    getCustomerQueries,
    addGeneralQuery,
    addQuery
} from "../controllers/HelpCenterController.js";

router.get('/get_customer_queries', getCustomerQueries);
router.post('/post_query', addQuery);
router.post('/post_general_query', addGeneralQuery);

export default router;
