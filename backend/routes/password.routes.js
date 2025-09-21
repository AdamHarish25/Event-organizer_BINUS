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
import logger from "../utils/logger.js";

dotenv.config({ path: "../.env" });

const ONE_MINUTES = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTES;
const TEN_MINUTES = 10 * ONE_MINUTES;
const FIVETEEN_MINUTES = 15 * ONE_MINUTES;

const rateLimitHandler = (sourceName) => {
    return (req, res, next, options) => {
        const correlationId =
            req.correlationId || req.headers["x-correlation-id"] || uuidv7();
        req.correlationId = correlationId;

        const specificKey = req.body.email || req.body.resetToken || "N/A";

        logger.warn(`Rate limit exceeded: ${sourceName}`, {
            correlationId,
            source: sourceName,
            context: {
                request: {
                    ip: req.ip,
                    method: req.method,
                    url: req.originalUrl,
                },
                limit: {
                    limit: options.limit,
                    windowMs: options.windowMs,
                },
                keyUsed: specificKey,
            },
        });

        res.status(options.statusCode).json(options.message);
    };
};

export const forgotPasswordLimiter = rateLimit({
    windowMs: FIVETEEN_MINUTES,
    max: 5,
    message: {
        success: false,
        error: "Terlalu banyak permintaan reset password, coba lagi dalam 15 menit",
    },
    keyGenerator: (req, res) => req.body.email || ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler("ForgotPasswordLimiter"),
    skipSuccessfulRequests: true,
});

const otpVerificationLimiter = rateLimit({
    windowMs: FIVE_MINUTES,
    max: 5,
    message: {
        success: false,
        error: "Terlalu banyak percobaan verifikasi OTP, coba lagi dalam 5 menit",
    },
    keyGenerator: (req) => req.body.email || ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler("OtpVerificationLimiter"),
    skipSuccessfulRequests: true,
});

const resetPasswordLimiter = rateLimit({
    windowMs: TEN_MINUTES,
    max: 3,
    message: {
        success: false,
        error: "Terlalu banyak percobaan reset password, coba lagi dalam 10 menit",
    },
    keyGenerator: (req) => req.body.resetToken || ipKeyGenerator(req),
    handler: rateLimitHandler("ResetPasswordLimiter"),
    skipSuccessfulRequests: true,
});

const router = express.Router();

/**
 * @openapi
 * /password/forgot-password:
 *   post:
 *     tags:
 *       - Password Reset
 *     summary: Memulai proses reset password (Langkah 1)
 *     description: |
 *       Mengirimkan email yang berisi kode OTP ke alamat email pengguna yang terdaftar.
 *       Ini adalah langkah pertama dalam alur reset password.
 *       Endpoint ini memiliki rate limit **5 request per 15 menit** per email/IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@binus.ac.id"
 *     responses:
 *       200:
 *         description: Permintaan berhasil, email berisi OTP telah dikirim.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to email"
 *       401:
 *         description: Data tidak valid (Validation Error).
 *       404:
 *         description: Email yang dimasukkan tidak terdaftar di sistem.
 *       429:
 *         description: Terlalu banyak permintaan reset password.
 *       502:
 *         description: Gagal mengirimkan email (Email Service Error).
 */
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    schemaValidator({ body: emailValidatorSchema }),
    forgotPassword
);

/**
 * @openapi
 * /password/verify-otp:
 *   post:
 *     tags:
 *       - Password Reset
 *     summary: Memverifikasi kode OTP (Langkah 2)
 *     description: |
 *       Memvalidasi kode OTP yang diterima pengguna melalui email.
 *       Jika OTP valid, endpoint ini akan mengembalikan `resetToken` yang akan digunakan pada langkah selanjutnya.
 *       Endpoint ini memiliki rate limit **5 percobaan per 5 menit** per email/IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@binus.ac.id"
 *               otp:
 *                 type: string
 *                 description: Kode OTP 6 digit.
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP berhasil diverifikasi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 resetToken:
 *                   type: string
 *                   description: Token yang harus digunakan untuk me-reset password.
 *       401:
 *         description: OTP tidak valid, kadaluarsa, atau percobaan sudah maksimal.
 *       404:
 *         description: Email tidak terdaftar.
 *       429:
 *         description: Terlalu banyak percobaan verifikasi OTP.
 */
router.post(
    "/verify-otp",
    otpVerificationLimiter,
    schemaValidator({ body: otpValidatorSchema }),
    verifyOTP
);

/**
 * @openapi
 * /password/reset-password:
 *   post:
 *     tags:
 *       - Password Reset
 *     summary: Mengatur ulang password baru (Langkah 3)
 *     description: |
 *       Mengatur password baru untuk pengguna menggunakan `resetToken` yang didapat dari verifikasi OTP.
 *       Ini adalah langkah terakhir dalam alur reset password.
 *       Endpoint ini memiliki rate limit **3 percobaan per 10 menit** per `resetToken`/IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - resetToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@binus.ac.id"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password baru, minimal 8 karakter.
 *                 example: "newStrongPassword123"
 *               resetToken:
 *                 type: string
 *                 description: Token yang didapat dari endpoint /verify-otp.
 *     responses:
 *       200:
 *         description: Password berhasil di-reset.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       401:
 *         description: Data tidak valid (Validation Error).
 *       403:
 *         description: Reset token tidak valid atau sudah kadaluarsa.
 *       404:
 *         description: Email tidak terdaftar.
 *       429:
 *         description: Terlalu banyak percobaan reset password.
 */
router.post(
    "/reset-password",
    resetPasswordLimiter,
    schemaValidator({ body: passwordValidatorSchema }),
    resetPassword
);

export default router;
