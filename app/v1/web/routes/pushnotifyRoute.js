const router = express.Router();
import express from "express";
import {
  addNotification,
  deleteRecord,
  fetchAllNotifications,
  fetchSingle,
  updateNotification,
} from "../controllers/PushNotifications.js";

router.get("/fetch", fetchAllNotifications);
router.post("/add", addNotification);
router.post("/update", updateNotification);
router.get("/fetch-single/:id", fetchSingle);
router.delete("/delete/:id", deleteRecord);

export default router;
