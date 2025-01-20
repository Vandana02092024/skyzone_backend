const router = express.Router();
import express from "express";
import { authToken } from "../../../helper/middleware.js";
import {
    createLogs,
    getLogs,
} from "../controllers/LogsController.js";

router.post('/create', createLogs);
router.get('/fetch', authToken, getLogs);

// PHP Version
router.post('/create.php', createLogs);
router.get('/fetch.php', authToken, getLogs);

export default router;