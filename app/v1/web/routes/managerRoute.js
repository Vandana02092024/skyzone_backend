const router = express.Router();
import express from "express";
import {
  createNewManager,
  fetchManagers,
  fetchSingleManager,
  updateSingleManager,
  userDeactivate,
} from "../controllers/ManagerController.js";

router.post("/create", createNewManager);
router.get("/fetch", fetchManagers);
router.get("/details", fetchSingleManager);
router.post("/update", updateSingleManager);
router.post("/status_update", userDeactivate);

export default router;
