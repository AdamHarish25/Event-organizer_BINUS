import bcrypt from "bcrypt";
import { Op } from "sequelize";
import AppError from "../utils/AppError.js";
import { sequelize } from "../config/dbconfig.js";

export const OTP_CONFIG = {
    MAX_ATTEMPTS: 3,
    EXPIRY_MINUTES: 5,
    RATE_LIMIT_WINDOW: 15,
    MAX_REQUESTS_PER_WINDOW: 5,
    BCRYPT_ROUNDS: 12,
    OTP_LENGTH: 6,
};

const validateOTPFormat = (otp) => {
    if (!otp || typeof otp !== "string") {
        throw new AppError("OTP harus berupa string", 400, "INVALID_FORMAT");
    }
    if (otp.length !== OTP_CONFIG.OTP_LENGTH) {
        throw new AppError(
            `OTP harus ${OTP_CONFIG.OTP_LENGTH} digit`,
            400,
            "INVALID_LENGTH"
        );
    }
    if (!/^\d+$/.test(otp)) {
        throw new AppError(
            "OTP hanya boleh berisi angka",
            400,
            "INVALID_CHARACTER"
        );
    }
};

export const validateOTP = async (user, otp, model, logger) => {
    const { OTPModel } = model;
    try {
        logger.info("OTP validation process started in service");
        validateOTPFormat(otp);

        const validationResult = await sequelize.transaction(async (t) => {
            const otpRecord = await OTPModel.findOne({
                where: {
                    userId: user.id,
                    verified: false,
                    valid: true,
                    expiresAt: { [Op.gt]: new Date() },
                },
                lock: t.LOCK.UPDATE,
                transaction: t,
            });

            if (!otpRecord) {
                logger.warn(
                    "OTP validation failed: No valid/unexpired OTP record found for user"
                );
                return { success: false, code: "EXPIRED_OR_INVALID_OTP" };
            }
            logger.info("Valid OTP record found, proceeding to compare hash");

            const isValid = await bcrypt.compare(otp, otpRecord.code);

            if (!isValid) {
                await otpRecord.increment("attempt", { by: 1, transaction: t });
                const newAttempt = otpRecord.attempt + 1;

                logger.warn("Invalid OTP submitted", {
                    context: {
                        attemptCount: newAttempt,
                        maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
                    },
                });

                if (newAttempt >= OTP_CONFIG.MAX_ATTEMPTS) {
                    await otpRecord.update(
                        { valid: false },
                        { transaction: t }
                    );
                    logger.warn(
                        "Max OTP attempts exceeded, token has been invalidated",
                        {
                            context: { otpId: otpRecord.id },
                        }
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
                {
                    valid: false,
                    verified: true,
                    attempt: otpRecord.attempt + 1,
                    verifiedAt: new Date(),
                },
                { transaction: t }
            );

            return { success: true };
        });

        if (!validationResult.success) {
            switch (validationResult.code) {
                case "EXPIRED_OR_INVALID_OTP":
                    throw new AppError(
                        "OTP sudah tidak berlaku atau telah kedaluwarsa",
                        401,
                        "EXPIRED_OTP"
                    );
                case "MAX_ATTEMPTS_EXCEEDED":
                    throw new AppError(
                        "OTP sudah tidak berlaku karena terlalu banyak percobaan",
                        401,
                        "MAX_ATTEMPTS_EXCEEDED"
                    );
                case "INVALID_OTP":
                    throw new AppError(
                        `OTP tidak valid. Sisa percobaan: ${validationResult.remainingAttempts}`,
                        401,
                        "INVALID_OTP"
                    );
                default:
                    throw new AppError(
                        "Terjadi kesalahan validasi OTP",
                        500,
                        "VALIDATION_ERROR"
                    );
            }
        }

        logger.info("OTP successfully validated and marked as verified");
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
            "Terjadi kesalahan saat validasi OTP",
            500,
            "VALIDATION_ERROR"
        );
    }
};

export const saveOTPToDatabase = async (
    userId,
    otp,
    model,
    transaction,
    logger
) => {
    const { OTPModel } = model;

    try {
        logger.info("Saving new OTP to database process started", {
            context: { userId }
        });

        // Validate userId
        if (!userId) {
            throw new AppError("User ID is required", 400, "INVALID_USER_ID");
        }

        const otpHash = await bcrypt.hash(otp, OTP_CONFIG.BCRYPT_ROUNDS);
        logger.info("OTP hashed successfully");

        // Invalidate previous OTPs
        const [updatedRows] = await OTPModel.update(
            { valid: false, invalidatedAt: new Date() },
            {
                where: {
                    userId,
                    verified: false,
                    valid: true,
                    expiresAt: { [Op.gt]: new Date() },
                    attempt: { [Op.lt]: OTP_CONFIG.MAX_ATTEMPTS },
                },
                transaction,
                returning: false,
            }
        );

        if (updatedRows > 0) {
            logger.info(
                `Invalidated ${updatedRows} previous valid OTP(s) for the user`
            );
        }

        const expiresAt = new Date(
            Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
        );
        
        logger.info("Creating new OTP record", {
            context: {
                userId,
                expiresAt,
                hasTransaction: !!transaction
            }
        });

        const newOTP = await OTPModel.create(
            {
                userId,
                code: otpHash,
                expiresAt,
                attempt: 0,
                valid: true,
                verified: false,
            },
            { transaction }
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
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    code: error.code,
                    sql: error.sql,
                },
                context: { userId }
            }
        );

        // Check for specific database errors
        if (error.name === 'SequelizeValidationError') {
            throw new AppError(
                "Data OTP tidak valid.",
                400,
                "VALIDATION_ERROR"
            );
        }
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            throw new AppError(
                "User tidak ditemukan.",
                404,
                "USER_NOT_FOUND"
            );
        }

        throw new AppError(
            "Gagal menyimpan OTP karena masalah internal.",
            500,
            "SAVE_OTP_ERROR"
        );
    }
};
