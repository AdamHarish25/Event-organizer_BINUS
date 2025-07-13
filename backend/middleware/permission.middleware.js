import AppError from "../utils/AppError.js";

export const adminValidator = (req, res, next) => {
    if (!req.user) {
        return next(
            new AppError(
                "Anda perlu login untuk mengakses sumber daya ini.",
                401,
                "UNAUTHORIZED"
            )
        );
    }

    if (req.user.role !== "admin") {
        return next(
            new AppError(
                "Anda tidak memiliki hak untuk mengakses sumber daya ini.",
                403,
                "FORBIDDEN"
            )
        );
    }

    next();
};

export const superAdminValidator = () => {};
