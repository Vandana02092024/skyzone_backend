const router = express.Router();
import express from "express";
import dotenv from "dotenv";

dotenv.config();

import {
  fetchMenuItems,
  fetchLocationProducts,
  addMenuItems,
  updateMenuItems,
  deleteMenuItems,
} from "../controllers/MenuItems.js";
import { uploadFileToS3 } from "../../../../helper/uploadMiddleware.js";

router.get("/fetch", fetchMenuItems);
router.get("/fetch-products", fetchLocationProducts);
router.post(
  "/add",
  uploadFileToS3("thumbnail", process.env.RIVETTE_BUCKET, "menuItems"),
  addMenuItems
);
router.post(
  "/update",
  uploadFileToS3("thumbnail", process.env.RIVETTE_BUCKET, "menuItems"),
  updateMenuItems
);

router.delete("/delete/:id", deleteMenuItems);

export default router;
