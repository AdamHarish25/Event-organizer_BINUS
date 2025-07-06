import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

const tokenValidator = (secretKey, tokenExtractor) => {
    return (req, res, next) => {
        try {
            const { token, type } = tokenExtractor(req);
            if (!token) {
                let errorCode = null;
                if (type === "accessToken") {
                    errorCode = "ACCESS_TOKEN_MISSING";
                } else if (type === "refreshToken") {
                    errorCode = "REFRESH_TOKEN_MISSING";
                } else {
                    errorCode = "NO_AUTH_TOKEN";
                }

                return next(
                    new AppError(
                        "Silahkan login terlebih dahulu.",
                        401,
                        errorCode
                    )
                );
            }

            const decoded = jwt.verify(token, secretKey);
            req.user = decoded;
            next();
        } catch (error) {
            let errorMessage = "Token tidak valid.";
            if (error.name === "TokenExpiredError") {
                errorMessage = "Token kadaluarsa. Silakan login kembali.";
            } else if (error.name === "JsonWebTokenError") {
                errorMessage = "Token tidak valid atau format salah.";
            }
            next(new AppError(errorMessage, 401, "TOKEN_VALIDATION_ERROR"));
        }
    };
};

export const accessTokenValidator = (secretKey) =>
    tokenValidator(secretKey, (req) => {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader ? authHeader.split(" ")[1] : null;
        return { token: accessToken, type: "accessToken" };
    });

export const refreshTokenValidator = (secretKey) =>
    tokenValidator(secretKey, (req) => {
        const refreshToken = req.cookies.refreshToken;
        return { token: refreshToken, type: "refreshToken" };
    });
