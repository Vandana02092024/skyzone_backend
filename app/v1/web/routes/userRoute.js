const router = express.Router();
import express from "express";
import {
  checkUserExists,
  fetchSingleUser,
  fetchUsers,
  fetchSingleUserDetails,
  updateSingleUser,
  SignUp,
  userDeactivate,
} from "../controllers/User.js";

router.get("/fetch", fetchUsers);
router.get("/details", fetchSingleUserDetails);
router.post("/check-user", checkUserExists);
router.get("/find-user", fetchSingleUser);
router.post("/update-user", updateSingleUser);
router.post("/register", SignUp);
router.delete("/delete/:id", userDeactivate);

export default router;
