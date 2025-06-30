export const loginValidator = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.validateAsync(req.body, {
                abortEarly: false,
                allowUnknown: true,
                convert: false,
            });
            next();
        } catch (error) {
            res.status(401).json({
                message: error,
            });
        }
    };
};
