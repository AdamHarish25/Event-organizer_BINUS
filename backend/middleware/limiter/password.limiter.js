import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import logger from "../../utils/logger.js";
import { uuidv7 } from "uuidv7";

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
    keyGenerator: (req, res) => req.body?.email || ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler("ForgotPasswordLimiter"),
    skipSuccessfulRequests: true,
});

export const otpVerificationLimiter = rateLimit({
    windowMs: FIVE_MINUTES,
    max: 5,
    message: {
        success: false,
        error: "Terlalu banyak percobaan verifikasi OTP, coba lagi dalam 5 menit",
    },
    keyGenerator: (req) => req.body?.email || ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler("OtpVerificationLimiter"),
    skipSuccessfulRequests: true,
});

export const resetPasswordLimiter = rateLimit({
    windowMs: TEN_MINUTES,
    max: 3,
    message: {
        success: false,
        error: "Terlalu banyak percobaan reset password, coba lagi dalam 10 menit",
    },
    keyGenerator: (req) => req.body?.resetToken || ipKeyGenerator(req),
    handler: rateLimitHandler("ResetPasswordLimiter"),
    skipSuccessfulRequests: true,
});
