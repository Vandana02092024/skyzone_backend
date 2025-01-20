const router = express.Router();
import express from "express";
import {
    getLatestVersion,
    addLatestVersion,
} from "../controllers/InfoController.js";

router.get('/get_latest_version', getLatestVersion);
router.post('/update_version', addLatestVersion);

export default router;
