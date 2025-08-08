import express from "express";
import dotenv from "dotenv";

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
const router = express.Router();

router.get(
    "/get-notification",
    accessTokenValidator(ACCESS_JWT_SECRET),
    authenticateBlacklistedToken,
    getNotification
);

router.patch(
    "/:notificationId/read",
    accessTokenValidator(ACCESS_JWT_SECRET),
    authenticateBlacklistedToken,
    schemaValidator({ params: notificationParamsSchema }),
    markAsRead
);

export default router;
