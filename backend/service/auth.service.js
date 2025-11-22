import bcrypt from "bcrypt";
import dotenv from "dotenv";

import getToken from "../utils/getToken.js";
import { saveNewRefreshToken } from "../service/token.service.js";
import { sendOTPEmail } from "../utils/emailSender.js";
import { saveOTPToDatabase } from "../service/otp.service.js";
import { generateOTP } from "../utils/otpGenerator.js";
import AppError from "../utils/AppError.js";
import { User, ResetToken } from "../model/index.js";
import {
    blacklistAccessToken,
    revokeRefreshToken,
} from "../service/token.service.js";
import { sequelize } from "../config/dbconfig.js";

const BCRPT_SALT_ROUDS = 10;

dotenv.config({ path: "../.env" });

export const handleUserLogin = async (data, deviceName, loginLogger) => {
    try {
        const { email, password } = data;

        loginLogger.info("Attempting to find user in database", { email });
        const user = await User.findOne({ where: { email } });

        if (!user) {
            loginLogger.warn("Login failed: User not found in database", {
                email,
            });
            throw new AppError(
                "Email atau Password salah.",
                401,
                "CLIENT_AUTH_ERROR"
            );
        }

        loginLogger.info("User found, proceeding with password verification", {
            userId: user.id,
        });

        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            loginLogger.warn("Login failed: Password mismatch", {
                userId: user.id,
            });
            throw new AppError(
                "Email atau Password salah.",
                401,
                "CLIENT_AUTH_ERROR"
            );
        }

        loginLogger.info("Password verified. Generating tokens...", {
            userId: user.id,
        });
        const payload = { id: user.id, role: user.role };
        const { accessToken, refreshToken } = getToken(payload);

        await saveNewRefreshToken(
            user.id,
            refreshToken,
            deviceName,
            loginLogger
        );

        loginLogger.info("New refresh token saved successfully", {
            userId: user.id,
            deviceName,
        });

        const userProfile = {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
        };

        return { user: userProfile, accessToken, refreshToken };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        loginLogger.error(
            "An unexpected error occurred in handleUserLogin service",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "An internal server error occurred",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};

export const handleUserLogout = async (token, userId, logoutLogger) => {
    const accessTokenFromUser = token?.accessTokenFromUser ?? null;
    const refreshTokenFromUser = token?.refreshTokenFromUser ?? null;

    logoutLogger.info("Starting logout process...");

    await Promise.allSettled([
        blacklistAccessToken(accessTokenFromUser, userId, logoutLogger),
        revokeRefreshToken(refreshTokenFromUser, userId, logoutLogger),
    ]);

    logoutLogger.info("Logout process completed.");
};

export const requestPasswordReset = async (email, logger) => {
    try {
        logger.info("Forgot password process started in service");

        const user = await User.findOne({ where: { email } });
        if (!user) {
            logger.warn("Password reset requested for a non-existent email");
            throw new AppError("Email tidak terdaftar", 404, "USER_NOT_FOUND");
        }
        logger.info("User found in database, proceeding to generate OTP", {
            context: { userId: user.id },
        });

        const otp = generateOTP();
        logger.info("OTP generated successfully");

        const mailOptions = {
            from: `BINUS Event Viewer <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Reset Password - Kode OTP`,
            html: `<!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="UTF-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <title>Reset Password</title>
                        </head>
                        <body
                            style="
                                margin: 0;
                                padding: 0;
                                font-family: Arial, sans-serif;
                                background-color: #f5f5f5;
                            "
                        >
                            <div
                                style="
                                    max-width: 600px;
                                    margin: 0 auto;
                                    background-color: #ffffff;
                                    padding: 40px 20px;
                                "
                            >
                                <div style="text-align: center; margin-bottom: 30px">
                                    <h1 style="color: #333333; font-size: 24px; margin: 0">
                                        Reset Password
                                    </h1>
                                </div>

                                <div
                                    style="
                                        background-color: #f8f9fa;
                                        padding: 20px;
                                        border-radius: 8px;
                                        margin-bottom: 20px;
                                    "
                                >
                                    <p
                                        style="
                                            color: #666666;
                                            font-size: 16px;
                                            line-height: 1.5;
                                            margin: 0 0 15px 0;
                                        "
                                    >
                                        Kami menerima permintaan untuk mereset password akun Anda.
                                        Gunakan kode OTP berikut untuk melanjutkan proses reset
                                        password.
                                    </p>

                                    <div style="text-align: center; margin: 25px 0">
                                        <div
                                            style="
                                                display: inline-block;
                                                background-color: #007bff;
                                                color: #ffffff;
                                                padding: 15px 30px;
                                                border-radius: 6px;
                                                font-size: 24px;
                                                font-weight: bold;
                                                letter-spacing: 2px;
                                            "
                                        >
                                            ${otp}
                                        </div>
                                    </div>

                                    <p
                                        style="
                                            color: #666666;
                                            font-size: 14px;
                                            margin: 15px 0 0 0;
                                            text-align: center;
                                        "
                                    >
                                        Kode ini akan kedaluwarsa dalam <strong>5 menit</strong>
                                    </p>
                                </div>

                                <div style="border-top: 1px solid #e9ecef; padding-top: 20px">
                                    <p
                                        style="
                                            color: #999999;
                                            font-size: 12px;
                                            line-height: 1.4;
                                            margin: 0;
                                        "
                                    >
                                        Jika Anda tidak meminta reset password, abaikan email ini.
                                        Password Anda akan tetap aman.

                                        <br /><br />

                                        Email ini dikirim secara otomatis, mohon tidak membalas
                                        email ini.
                                    </p>
                                </div>
                            </div>
                        </body>
                    </html>
                    `,
        };

        logger.info("Starting database transaction to save OTP and send email");
        await sequelize.transaction(async (transaction) => {
            await saveOTPToDatabase(user.id, otp, transaction, logger);
            logger.info("OTP successfully saved to database");

            await sendOTPEmail(mailOptions, email, logger);
            logger.info("OTP email sent successfully via email service");
        });

        logger.info("Database transaction committed successfully");
    } catch (error) {
        if (error instanceof AppError) throw error;

        logger.error(
            "An unexpected error occurred in requestPasswordReset service",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    code: error.code,
                },
            }
        );

        if (error.code && error.code.startsWith("E")) {
            throw new AppError(
                "Gagal mengirimkan email verifikasi.",
                502,
                "EMAIL_SERVICE_ERROR"
            );
        }

        throw new AppError(
            "Terjadi kesalahan internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};

export const resetPasswordHandler = async (
    user,
    newPassword,
    resetToken,
    logger
) => {
    try {
        logger.info("Password reset handling process started in service");

        const tokenRecords = await ResetToken.findAll({
            where: { userId: user.id, verified: false },
        });

        if (!tokenRecords || tokenRecords.length === 0) {
            logger.warn(
                "Password reset failed: No active reset tokens found for user"
            );
            throw new AppError(
                "Token reset tidak valid atau telah kedaluwarsa.",
                403,
                "INVALID_TOKEN"
            );
        }
        logger.info(
            `Found ${tokenRecords.length} active reset token(s). Starting comparison.`
        );

        let matchedData = null;
        for (const dataRow of tokenRecords) {
            const isMatch = await bcrypt.compare(resetToken, dataRow.token);
            if (isMatch) {
                matchedData = dataRow;
                break;
            }
        }

        if (!matchedData) {
            logger.warn(
                "Password reset failed: Provided reset token did not match any stored tokens"
            );
            throw new AppError(
                "Token reset tidak valid atau telah kedaluwarsa.",
                403,
                "INVALID_TOKEN"
            );
        }
        logger.info(
            "Reset token matched successfully. Proceeding to update password."
        );

        const hashedNewPassword = await bcrypt.hash(
            newPassword,
            BCRPT_SALT_ROUDS
        );

        await sequelize.transaction(async (t) => {
            await User.update(
                { password: hashedNewPassword },
                { where: { id: user.id }, transaction: t }
            );
            logger.info("User password record has been updated successfully");

            await ResetToken.destroy({
                where: { userId: user.id },
                transaction: t,
            });
            logger.info("All reset tokens for the user have been destroyed");
        });
        logger.info(
            "Database transaction for password reset committed successfully"
        );
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error(
            "An unexpected error occurred in resetPasswordHandler service",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal mereset password karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};
