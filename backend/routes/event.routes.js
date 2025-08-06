import express from "express";
import dotenv from "dotenv";

import { accessTokenValidator } from "../middleware/tokenValidator.middleware.js";
import {
    eventViewer,
    createEvent,
    deleteEvent,
    createFeedback,
    editEvent,
    rejectEvent,
    approveEvent,
} from "../controller/event.controller.js";
import { authenticateBlacklistedToken } from "../middleware/auth.middleware.js";
import { roleValidator } from "../middleware/permission.middleware.js";
import { schemaValidator } from "../middleware/schemaValidator.middleware.js";
import {
    createEventSchema,
    updateEventSchema,
    feedbackSchema,
    eventParamsSchema,
} from "../validator/event.validator.js";
import uploadPoster from "../middleware/uploadPoster.middleware.js";
import handleMulter from "../middleware/handleMulter.js";

dotenv.config({ path: "../.env" });

const { ACCESS_JWT_SECRET } = process.env;
const router = express.Router();

// Basic CRUD
router.get(
    "/",
    accessTokenValidator(ACCESS_JWT_SECRET),
    authenticateBlacklistedToken,
    eventViewer
);

router.post(
    "/",
    accessTokenValidator(ACCESS_JWT_SECRET),
    roleValidator("admin"),
    handleMulter(uploadPoster.single("image")),
    schemaValidator({ body: createEventSchema }),
    createEvent
);

router.patch(
    "/:eventId",
    accessTokenValidator(ACCESS_JWT_SECRET),
    roleValidator("admin"),
    handleMulter(uploadPoster.single("image")),
    schemaValidator({
        params: eventParamsSchema,
        body: updateEventSchema,
    }),
    editEvent
);

router.delete(
    "/:eventId",
    accessTokenValidator(ACCESS_JWT_SECRET),
    roleValidator("admin"),
    schemaValidator({ params: eventParamsSchema }),
    deleteEvent
);

// Event Management Actions
router.post(
    "/:eventId/approve",
    accessTokenValidator(ACCESS_JWT_SECRET),
    roleValidator("super_admin"),
    schemaValidator({ params: eventParamsSchema }),
    approveEvent
);

router.post(
    "/:eventId/reject",
    accessTokenValidator(ACCESS_JWT_SECRET),
    roleValidator("super_admin"),
    schemaValidator({ params: eventParamsSchema }),
    rejectEvent
);

router.post(
    "/:eventId/feedback",
    accessTokenValidator(ACCESS_JWT_SECRET),
    roleValidator("super_admin"),
    schemaValidator({
        params: eventParamsSchema,
        body: feedbackSchema,
    }),
    createFeedback
);

export default router;
