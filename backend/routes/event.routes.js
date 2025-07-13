import express from "express";
import dotenv from "dotenv";

import { accessTokenValidator } from "../middleware/tokenValidator.middleware.js";
import { eventViewer, createEvent } from "../controller/event.controller.js";
import { authenticateBlacklistedToken } from "../middleware/auth.middleware.js";
import { adminValidator } from "../middleware/permission.middleware.js";
import { schemaValidator } from "../middleware/schemaValidator.middleware.js";
import eventSchema from "../validator/event.validator.js";
import uploadPoster from "../middleware/uploadPoster.middleware.js";
import handleMulter from "../middleware/handleMulter.js";

dotenv.config({ path: "../.env" });

const { ACCESS_JWT_SECRET } = process.env;
const router = express.Router();

router.get(
    "/get-event",
    accessTokenValidator(ACCESS_JWT_SECRET),
    authenticateBlacklistedToken,
    eventViewer
);

router.post(
    "/create-event",
    accessTokenValidator(ACCESS_JWT_SECRET),
    adminValidator,
    handleMulter(uploadPoster.single("image")),
    schemaValidator(eventSchema),
    createEvent
);

export default router;
