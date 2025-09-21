import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

export const roleValidator = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        const { correlationId, user } = req;

        if (!user) {
            logger.warn("Authorization failed: User not authenticated", {
                correlationId,
                source: "RoleValidator",
                context: {
                    requiredRoles: roles,
                    request: {
                        ip: req.ip,
                        url: req.originalUrl,
                    },
                },
            });
            return next(
                new AppError(
                    "Anda perlu login untuk mengakses sumber daya ini.",
                    401,
                    "UNAUTHORIZED"
                )
            );
        }

        if (!roles.includes(user.role)) {
            logger.warn("Authorization failed: Role not permitted", {
                correlationId,
                source: "RoleValidator",
                context: {
                    userId: user.id,
                    userRole: user.role,
                    requiredRoles: roles,
                    request: {
                        ip: req.ip,
                        url: req.originalUrl,
                    },
                },
            });
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
};
