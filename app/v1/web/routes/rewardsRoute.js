const router = express.Router();
import express from "express";
import dotenv from "dotenv";

dotenv.config();

import {
  fetchRewardProducts,
  fetchLocationProducts,
  addRewardRule,
  updateRewardRule,
  deleteRewardRule
} from "../controllers/Rewards.js";
import { uploadFileToS3 } from "../../../../helper/uploadMiddleware.js";

router.get("/fetch", fetchRewardProducts);
router.get("/fetch-products", fetchLocationProducts);
router.post(
  "/add-reward-rule",
  uploadFileToS3("thumbnail", process.env.RIVETTE_BUCKET, "rewards"),
  addRewardRule
);
router.post(
  "/update-reward-rule",
  uploadFileToS3("thumbnail", process.env.RIVETTE_BUCKET, "rewards"),
  updateRewardRule
);

router.delete(
  "/delete/:id",
  deleteRewardRule
);

export default router;
