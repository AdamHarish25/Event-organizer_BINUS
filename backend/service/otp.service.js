import bcrypt from "bcrypt";
import { Op } from "sequelize";
import AppError from "../utils/AppError.js";
import { sequelize } from "../config/dbconfig.js";
import { OTP } from "../model/index.js";
import * as OTP_CONFIG from "../constant/otp.constant.js";

const validateOTPFormat = (otp) => {
    if (!otp || typeof otp !== "string") {
        throw new AppError("OTP harus berupa string", 400, "INVALID_FORMAT");
    }
    if (otp.length !== OTP_CONFIG.OTP_LENGTH) {
        throw new AppError(
            `OTP harus ${OTP_CONFIG.OTP_LENGTH} digit`,
            400,
            "INVALID_LENGTH",
        );
    }
    if (!/^\d+$/.test(otp)) {
        throw new AppError(
            "OTP hanya boleh berisi angka",
            400,
            "INVALID_CHARACTER",
        );
    }
};

export const validateOTP = async (user, otp, logger) => {
    try {
        logger.info("OTP validation process started in service");

        validateOTPFormat(otp);

        const validationResult = await sequelize.transaction(async (t) => {
            const otpRecord = await OTP.findOne({
                where: {
                    userId: user.id,
                    verifiedAt: null,
                    revokedAt: null,
                    expiresAt: { [Op.gt]: new Date() },
                },
                lock: t.LOCK.UPDATE,
                transaction: t,
                order: [["createdAt", "DESC"]],
            });

            if (!otpRecord) {
                logger.warn(
                    "OTP validation failed: No valid/unexpired OTP record found for user",
                );
                return { success: false, code: "EXPIRED_OR_INVALID_OTP" };
            }

            logger.info("Valid OTP record found, proceeding to compare hash");

            const isValid = await bcrypt.compare(otp, otpRecord.code);

            if (!isValid) {
                const newAttempt = otpRecord.attempt + 1;

                await otpRecord.update(
                    { attempt: newAttempt },
                    { transaction: t },
                );

                logger.warn("Invalid OTP submitted", {
                    context: {
                        attemptCount: newAttempt,
                        maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
                    },
                });

                if (newAttempt >= OTP_CONFIG.MAX_ATTEMPTS) {
                    await otpRecord.update(
                        { revokedAt: new Date() },
                        { transaction: t },
                    );

                    logger.warn(
                        "Max OTP attempts exceeded, token has been revoked",
                        {
                            context: { otpId: otpRecord.id },
                        },
                    );
                    return { success: false, code: "MAX_ATTEMPTS_EXCEEDED" };
                }

                return {
                    success: false,
                    code: "INVALID_OTP",
                    remainingAttempts: OTP_CONFIG.MAX_ATTEMPTS - newAttempt,
                };
            }

            await otpRecord.update(
                { verifiedAt: new Date() },
                { transaction: t },
            );

            return { success: true };
        });

        if (!validationResult.success) {
            switch (validationResult.code) {
                case "EXPIRED_OR_INVALID_OTP":
                    throw new AppError(
                        "OTP sudah tidak berlaku atau telah kedaluwarsa",
                        400,
                        "EXPIRED_OTP",
                    );
                case "MAX_ATTEMPTS_EXCEEDED":
                    throw new AppError(
                        "OTP hangus karena terlalu banyak percobaan salah.",
                        400,
                        "MAX_ATTEMPTS_EXCEEDED",
                    );
                case "INVALID_OTP":
                    throw new AppError(
                        `OTP salah. Sisa percobaan: ${validationResult.remainingAttempts}`,
                        400,
                        "INVALID_OTP",
                    );
                default:
                    throw new AppError(
                        "Terjadi kesalahan validasi OTP",
                        500,
                        "VALIDATION_ERROR",
                    );
            }
        }

        logger.info("OTP successfully validated and marked as verified");

        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error("An unexpected error occurred during OTP validation", {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });

        throw new AppError(
            "Terjadi kesalahan sistem saat validasi OTP",
            500,
            "VALIDATION_ERROR",
        );
    }
};

export const saveOTPToDatabase = async (userId, otp, transaction, logger) => {
    try {
        logger.info("Saving new OTP to database process started", {
            context: { userId },
        });

        const otpHash = await bcrypt.hash(otp, OTP_CONFIG.BCRYPT_ROUNDS);
        logger.info("OTP hashed successfully", { context: { userId } });

        const [updatedRows] = await OTP.update(
            {
                revokedAt: new Date(),
            },
            {
                where: {
                    userId,
                    verifiedAt: null,
                    revokedAt: null,
                    expiresAt: { [Op.gt]: new Date() },
                },
                transaction,
            },
        );

        if (updatedRows > 0) {
            logger.info("Revoked previous active OTP(s)", {
                context: {
                    count: updatedRows,
                    userId: userId,
                },
            });
        }

        const expiresAt = new Date(
            Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000,
        );

        logger.info("Creating new OTP record", {
            context: {
                userId,
                expiresAt,
                hasTransaction: !!transaction,
            },
        });

        const newOTP = await OTP.create(
            {
                userId,
                code: otpHash,
                expiresAt,
            },
            { transaction },
        );

        logger.info("New OTP record created successfully in database", {
            context: {
                otpId: newOTP.id,
                expiresAt: newOTP.expiresAt,
            },
        });

        return newOTP;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error(
            "An unexpected error occurred while saving OTP to database",
            {
                context: { userId },
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            },
        );

        throw new AppError(
            "Gagal menyimpan OTP karena masalah internal.",
            500,
            "SAVE_OTP_ERROR",
        );
    }
};
