import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { accessTokenValidator } from "../middleware/tokenValidator.middleware.js";
import {
    getNotification,
    markAsRead,
} from "../controller/notification.controller.js";
import { authenticateBlacklistedToken } from "../middleware/auth.middleware.js";
import { schemaValidator } from "../middleware/schemaValidator.middleware.js";
import { notificationParamsSchema } from "../validator/notification.validator.js";

dotenv.config({ path: "../.env" });
const { ACCESS_JWT_SECRET } = process.env;

const notificationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
    message: {
        success: false,
        error: "Terlalu banyak request notifikasi, coba lagi dalam 1 menit",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.get(
    "/",
    notificationLimiter,
    accessTokenValidator(ACCESS_JWT_SECRET),
    authenticateBlacklistedToken,
    getNotification
);

router.patch(
    "/:notificationId/read",
    notificationLimiter,
    accessTokenValidator(ACCESS_JWT_SECRET),
    authenticateBlacklistedToken,
    schemaValidator({ params: notificationParamsSchema }),
    markAsRead
);

export default router;
