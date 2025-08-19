import bcrypt from "bcrypt";
import { Op } from "sequelize";
import AppError from "../utils/AppError.js";

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

const checkRateLimit = async (userId, OTPModel) => {
    const windowStart = new Date(
        Date.now() - OTP_CONFIG.RATE_LIMIT_WINDOW * 60 * 1000
    );

    const recentAttempts = await OTPModel.count({
        where: {
            userId,
            createdAt: { [Op.gt]: windowStart },
        },
    });

    if (recentAttempts >= OTP_CONFIG.MAX_REQUESTS_PER_WINDOW) {
        console.warn(`Rate limit exceeded for user ${userId}`);
        throw new AppError(
            `Terlalu banyak permintaan OTP. Coba lagi dalam ${OTP_CONFIG.RATE_LIMIT_WINDOW} menit`,
            429,
            "RATE_LIMITED"
        );
    }
};

export const validateOTP = async (user, otp, model) => {
    const { OTPModel } = model;

    validateOTPFormat(otp);

    await checkRateLimit(user.id, OTPModel);

    console.info(`OTP validation attempt for user ${user.id}`);

    try {
        await OTPModel.sequelize.transaction(async (t) => {
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
                console.warn(`No valid OTP found for user ${user.id}`);
                throw new AppError(
                    "OTP sudah tidak berlaku atau telah kedaluwarsa",
                    401,
                    "EXPIRED_OTP"
                );
            }

            // Cek jumlah percobaan
            if (otpRecord.attempt >= OTP_CONFIG.MAX_ATTEMPTS) {
                await otpRecord.update({ valid: false }, { transaction: t });
                console.warn(
                    `Max attempts exceeded for OTP ${otpRecord.id}, user ${user.id}`
                );
                throw new AppError(
                    "OTP sudah tidak berlaku karena terlalu banyak percobaan",
                    401,
                    "MAX_ATTEMPTS_EXCEEDED"
                );
            }

            // Validasi OTP
            const isValid = await bcrypt.compare(otp, otpRecord.code);
            if (!isValid) {
                const updated = await otpRecord.increment("attempt", {
                    by: 1,
                    transaction: t,
                });
                const newAttempt = updated.get("attempt");
                const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - newAttempt;

                console.warn(
                    `Invalid OTP attempt ${newAttempt}/${OTP_CONFIG.MAX_ATTEMPTS} for user ${user.id}`
                );
                throw new AppError(
                    remainingAttempts > 0
                        ? `OTP tidak valid. Sisa percobaan: ${remainingAttempts}`
                        : "OTP tidak valid. Tidak ada sisa percobaan.",
                    401,
                    "INVALID_OTP"
                );
            }

            // OTP valid → update status
            await otpRecord.update(
                {
                    valid: false,
                    verified: true,
                    attempt: otpRecord.attempt + 1,
                    verifiedAt: new Date(),
                },
                { transaction: t }
            );

            console.info(`OTP successfully validated for user ${user.id}`);
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(
            `Unexpected error in OTP validation for user ${user.id}:`,
            error
        );
        throw new AppError(
            "Terjadi kesalahan saat validasi OTP",
            500,
            "VALIDATION_ERROR"
        );
    }
};

export const saveOTPToDatabase = async (userId, otp, model, transaction) => {
    const { OTPModel } = model;

    try {
        await checkRateLimit(userId, OTPModel);

        console.info(`Saving new OTP for user ${userId}`);

        const otpHash = await bcrypt.hash(otp, OTP_CONFIG.BCRYPT_ROUNDS);

        await OTPModel.update(
            { valid: false, invalidatedAt: new Date() },
            {
                where: {
                    userId,
                    verified: false,
                    valid: true,
                    attempt: { [Op.lt]: OTP_CONFIG.MAX_ATTEMPTS },
                    expiresAt: { [Op.gt]: new Date() },
                },
                transaction,
            }
        );

        // Buat OTP baru
        const expiresAt = new Date(
            Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
        );
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

        console.info(
            `New OTP created with ID ${newOTP.id} for user ${userId}, expires at ${expiresAt}`
        );
        return newOTP;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error saving OTP for user ${userId}:`, error);
        throw new AppError("Gagal menyimpan OTP", 500, "SAVE_ERROR");
    }
};

export const cleanupExpiredOTPs = async (model) => {
    const { OTPModel } = model;

    try {
        const deletedCount = await OTPModel.destroy({
            where: {
                [Op.or]: [
                    { expiresAt: { [Op.lt]: new Date() } },
                    {
                        verified: true,
                        verifiedAt: {
                            [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                ],
            },
        });

        if (deletedCount > 0) {
            console.info(`Cleaned up ${deletedCount} expired/old OTP records`);
        }

        return deletedCount;
    } catch (error) {
        console.error("Error cleaning up expired OTPs:", error);
        throw new AppError(
            "Gagal membersihkan OTP yang kedaluwarsa",
            500,
            "CLEANUP_ERROR"
        );
    }
};
