const router = express.Router();
import express from "express";
import { LogIn, Verify } from "../controllers/Auth.js";

router.post("/login", LogIn);
router.post("/verify", Verify);

export default router;
