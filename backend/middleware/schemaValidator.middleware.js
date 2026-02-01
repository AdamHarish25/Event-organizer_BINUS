import { uuidv7 } from "uuidv7";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

export const schemaValidator = (schemas) => {
    return async (req, res, next) => {
        const errors = {};
        const correlationId =
            req.correlationId || req.headers["x-correlation-id"] || uuidv7();
        req.correlationId = correlationId;

        try {
            if (schemas.body) {
                const hasImage = "image" in schemas.body.describe().keys;
                const data = hasImage
                    ? { ...req.body, image: req.file }
                    : req.body;

                const validatedData = await schemas.body.validateAsync(data, {
                    abortEarly: false,
                    allowUnknown: true,
                    convert: true,
                });

                req.body = validatedData;
            }

            if (schemas.params) {
                const validatedParams = await schemas.params.validateAsync(
                    req.params,
                    {
                        abortEarly: false,
                        allowUnknown: false,
                        convert: true,
                    },
                );

                req.params = validatedParams;
            }

            if (schemas.query) {
                const validatedQuery = await schemas.query.validateAsync(
                    req.query,
                    {
                        abortEarly: false,
                        allowUnknown: true,
                        convert: true,
                    },
                );

                req.query = validatedQuery;
            }

            next();
        } catch (error) {
            if (error.details) {
                error.details.forEach(({ path: [field], message }) => {
                    errors[field] = errors[field] || message;
                });

                logger.warn("Input validation failed", {
                    correlationId: correlationId,
                    source: "ValidationMiddleware",
                    context: {
                        request: {
                            ip: req.ip,
                            method: req.method,
                            url: req.originalUrl,
                            userAgent: req.headers["user-agent"],
                        },
                        validationErrors: errors,
                    },
                });
            }

            next(
                new AppError(
                    "Invalid request data",
                    400,
                    "VALIDATION_ERROR",
                    errors,
                ),
            );
        }
    };
};
