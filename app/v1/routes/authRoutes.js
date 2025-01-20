const router = express.Router();
import express from "express";
import {
    createUser,
    verifyOtp,
    resendOtp,
    login,
    regenrateToken
} from "../controllers/AuthenticationController.js";

router.post('/register', createUser);
router.post('/verify_otp', verifyOtp);
router.post('/resend_otp', resendOtp);
router.post('/login', login);
router.post('/refresh_token', regenrateToken);

export default router;
