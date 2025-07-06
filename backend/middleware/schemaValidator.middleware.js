import AppError from "../utils/AppError.js";

export const schemaValidator = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.validateAsync(req.body, {
                abortEarly: false,
                allowUnknown: true,
                convert: false,
            });
            next();
        } catch (error) {
            const errors = {};
            error.details.forEach(
                ({ path: [field], message }) =>
                    (errors[field] = errors[field] || message)
            );

            next(
                new AppError(
                    "Invalid request data",
                    401,
                    "VALIDATION_ERROR",
                    errors
                )
            );
        }
    };
};
