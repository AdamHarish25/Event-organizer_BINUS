import crypto from "crypto";
import { uuidv7 } from "uuidv7";

import db from "../model/index.js";
import {
    requestPasswordReset,
    resetPasswordHandler,
} from "../service/auth.service.js";
import { validateOTP } from "../service/otp.service.js";
import { saveResetTokenToDatabase } from "../service/token.service.js";
import AppError from "../utils/AppError.js";

export const forgotPassword = async (req, res, next) => {
    const correlationId =
        req.correlationId || req.headers["x-correlation-id"] || uuidv7();
    req.correlationId = correlationId;

    const { email } = req.body;

    const controllerLogger = logger.child({
        correlationId,
        source: "AuthController.forgotPassword",
        context: {
            targetEmail: email,
        },
    });

    try {
        controllerLogger.info("Forgot password process initiated");

        const model = {
            UserModel: db.User,
            OTPModel: db.OTP,
        };

        await requestPasswordReset(email, model, controllerLogger);

        controllerLogger.info("Forgot password OTP sent successfully");

        res.status(200).json({
            status: "success",
            message: "OTP sent to your email.",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `Forgot password process failed: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};

export const verifyOTP = async (req, res, next) => {
    const correlationId =
        req.correlationId || req.headers["x-correlation-id"] || uuidv7();
    req.correlationId = correlationId;

    const { email, otp } = req.body;

    const controllerLogger = logger.child({
        correlationId,
        source: "AuthController.verifyOTP",
        context: {
            targetEmail: email,
        },
    });

    try {
        controllerLogger.info("OTP verification process initiated");

        const model = {
            OTPModel: db.OTP,
            ResetTokenModel: db.ResetToken,
        };

        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            controllerLogger.warn("User not found, aborting OTP validation", {
                context: { userIdentifier: inputUserIdentifier },
            });
            throw new AppError("Email tidak terdaftar", 404, "USER_NOT_FOUND");
        }

        controllerLogger.info("User found, proceeding with OTP validation", {
            context: { userId: user.id },
        });

        await validateOTP(user, otp, model, controllerLogger);

        const resetToken = crypto.randomBytes(32).toString("hex");

        await saveResetTokenToDatabase(
            user,
            resetToken,
            model,
            controllerLogger
        );

        controllerLogger.info(
            "OTP verified successfully, reset token generated and saved"
        );

        res.status(200).json({
            status: "success",
            message: "OTP verified successfully",
            resetToken,
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `OTP verification process failed: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    const correlationId =
        req.correlationId || req.headers["x-correlation-id"] || uuidv7();
    req.correlationId = correlationId;

    const { email, password: newPassword, resetToken } = req.body;

    const controllerLogger = logger.child({
        correlationId,
        source: "AuthController.resetPassword",
        context: {
            targetEmail: email,
        },
    });

    try {
        controllerLogger.info("Password reset process initiated", {
            context: {
                resetTokenProvided: !!resetToken,
            },
        });

        const model = {
            UserModel: db.User,
            ResetTokenModel: db.ResetToken,
        };

        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            throw new AppError("Email tidak terdaftar", 404, "USER_NOT_FOUND");
        }
        controllerLogger.info(
            "User found, proceeding with password reset handler",
            { context: { userId: user.id } }
        );

        await resetPasswordHandler(
            user,
            newPassword,
            model,
            resetToken,
            controllerLogger
        );

        controllerLogger.info("Password reset successfully for user");

        res.status(200).json({
            status: "success",
            message: "Password reset successfully",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `Password reset process failed: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};
