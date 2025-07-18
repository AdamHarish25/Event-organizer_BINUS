import express from "express";
import dotenv from "dotenv";

import { accessTokenValidator } from "../middleware/tokenValidator.middleware.js";
import {
    eventViewer,
    createEvent,
    deleteEvent,
} from "../controller/event.controller.js";
import { authenticateBlacklistedToken } from "../middleware/auth.middleware.js";
import { adminValidator } from "../middleware/permission.middleware.js";
import { schemaValidator } from "../middleware/schemaValidator.middleware.js";
import { eventSchema, paramsSchema } from "../validator/event.validator.js";
import uploadPoster from "../middleware/uploadPoster.middleware.js";
import handleMulter from "../middleware/handleMulter.js";
import { emailValidatorSchema } from "../validator/auth.validator.js";

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
    schemaValidator({ body: eventSchema }),
    createEvent
);

router.delete(
    "/delete-event/:id",
    schemaValidator({ params: paramsSchema }),
    deleteEvent
);

export default router;
