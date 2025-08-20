import express from "express";
import dotenv from "dotenv";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
    emailValidatorSchema,
    passwordValidatorSchema,
    otpValidatorSchema,
} from "../validator/auth.validator.js";
import { schemaValidator } from "../middleware/schemaValidator.middleware.js";
import {
    forgotPassword,
    verifyOTP,
    resetPassword,
} from "../controller/password.controller.js";

dotenv.config({ path: "../.env" });
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: "Terlalu banyak permintaan reset password, coba lagi dalam 15 menit",
    },
    keyGenerator: (req, res) => req.body.email || ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
});

const otpVerificationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5,
    message: {
        success: false,
        error: "Terlalu banyak percobaan verifikasi OTP, coba lagi dalam 5 menit",
    },
    keyGenerator: (req) => req.body.email || ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3,
    message: {
        success: false,
        error: "Terlalu banyak percobaan reset password, coba lagi dalam 10 menit",
    },
    keyGenerator: (req) => req.body.resetToken || ipKeyGenerator(req),
});

const router = express.Router();

router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    schemaValidator({ body: emailValidatorSchema }),
    forgotPassword
);

router.post(
    "/verify-otp",
    otpVerificationLimiter,
    schemaValidator({ body: otpValidatorSchema }),
    verifyOTP
);

router.post(
    "/reset-password",
    resetPasswordLimiter,
    schemaValidator({ body: passwordValidatorSchema }),
    resetPassword
);

export default router;
