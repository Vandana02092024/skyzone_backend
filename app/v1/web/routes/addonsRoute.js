const router = express.Router();
import express from "express";
import {
  createNewAddon,
  fetchLocationProducts,
  getAllAddons,
  deleteAddon,
  getAddonsProducts
} from "../controllers/Addons.js";

router.get("/fetch", getAllAddons);
router.get("/fetch-products", fetchLocationProducts);
router.post("/create", createNewAddon);
router.delete("/delete/:id", deleteAddon);
// router.get("/get-addons-products", getAddonsProducts);
export default router;
