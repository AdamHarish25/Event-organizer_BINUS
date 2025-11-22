import bcrypt from "bcrypt";
import getToken from "../utils/getToken.js";
import AppError from "../utils/AppError.js";
import { RefreshToken, ResetToken, BlacklistedToken } from "../model/index.js";
import dotenv from "dotenv";

dotenv.config();

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const saveNewRefreshToken = async (
    userId,
    newRefreshToken,
    deviceName,
    loginLogger
) => {
    try {
        loginLogger.info("Starting process to save new refresh token");

        const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        const userRefreshTokens = await RefreshToken.findAll({
            where: { ownerId: userId },
            order: [["expiresAt", "ASC"]],
        });
        loginLogger.info(
            `Found ${userRefreshTokens.length} existing token records for user`
        );

        const revokedToken = userRefreshTokens.find(
            (token) => token.isRevoked === true
        );

        const tokenData = {
            token: hashedNewRefreshToken,
            isRevoked: false,
            expiresAt: new Date(Date.now() + SEVEN_DAYS),
        };

        if (revokedToken) {
            loginLogger.info(
                "Reusing a previously revoked token record to save the new token",
                { tokenId: revokedToken.id }
            );
            await RefreshToken.update(tokenData, {
                where: { id: revokedToken.id },
            });
        } else if (userRefreshTokens.length < 3) {
            loginLogger.info("Creating a new refresh token record", {
                deviceName,
            });
            await RefreshToken.create({
                ...tokenData,
                ownerId: userId,
                device: deviceName,
            });
        } else {
            const oldestToken = userRefreshTokens[0];
            loginLogger.info(
                "Overwriting the oldest refresh token record (session limit reached)",
                { tokenId: oldestToken.id, deviceName }
            );
            await RefreshToken.update(tokenData, {
                where: { id: oldestToken.id },
            });
        }
    } catch (error) {
        loginLogger.error(
            "Failed to save new refresh token due to a system error",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal menyimpan sesi login karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};

export const renewAccessToken = async (
    user,
    oldRefreshToken,
    refreshTokenLogger
) => {
    try {
        refreshTokenLogger.info("Searching for user's active refresh tokens");
        const refreshTokenList = await RefreshToken.findAll({
            where: { ownerId: user.id, isRevoked: false },
        });

        if (!refreshTokenList || refreshTokenList.length === 0) {
            refreshTokenLogger.warn(
                "Token refresh failed: No active refresh tokens found in DB for user"
            );
            throw new AppError(
                "Sesi tidak valid. Silakan login kembali.",
                403,
                "REFRESH_TOKEN_NOT_FOUND"
            );
        }
        refreshTokenLogger.info(
            `Found ${refreshTokenList.length} active token(s). Starting comparison.`
        );

        let tokenRecord;
        for (const refreshToken of refreshTokenList) {
            const isMatch = await bcrypt.compare(
                oldRefreshToken,
                refreshToken.token
            );
            if (isMatch) {
                tokenRecord = refreshToken;
                break;
            }
        }

        if (!tokenRecord) {
            refreshTokenLogger.warn(
                "Token refresh failed: Provided refresh token did not match any stored tokens"
            );
            throw new AppError(
                "Sesi Anda tidak valid. Silakan login kembali.",
                403,
                "REFRESH_TOKEN_MISMATCH"
            );
        }
        refreshTokenLogger.info(
            "Matching refresh token found. Proceeding to generate new tokens."
        );

        const payload = { id: user.id, role: user.role };
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            getToken(payload);
        refreshTokenLogger.info("New token pair generated successfully");

        const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await RefreshToken.update(
            {
                token: hashedNewRefreshToken,
                expiresAt: new Date(Date.now() + SEVEN_DAYS),
            },
            {
                where: { ownerId: user.id, token: tokenRecord.token },
            }
        );
        refreshTokenLogger.info(
            "Successfully updated the refresh token record in database (token rotation)"
        );

        return { newAccessToken, newRefreshToken };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        refreshTokenLogger.error(
            "An unexpected error occurred in renewAccessToken service",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal memperbarui token karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};

export const saveResetTokenToDatabase = async (user, resetToken) => {
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    await ResetToken.create({
        userId: user.id,
        token: hashedResetToken,
        expiresAt: Date.now() + 5 * 60 * 1000,
    });
};

export const blacklistAccessToken = async (
    accessTokenFromUser,
    userId,
    logoutLogger
) => {
    try {
        if (accessTokenFromUser) {
            await BlacklistedToken.create({
                token: accessTokenFromUser,
                userId,
                reason: "logout",
                expiresAt: new Date(Date.now() + FIFTEEN_MINUTES),
            });
            logoutLogger.info("Access token successfully added to blacklist");
        } else {
            logoutLogger.info("Skipping blacklist: No access token provided");
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logoutLogger.error("Failed to blacklist access token", {
            error: error.message,
        });

        logoutLogger.error(
            "An unexpected error occurred in handleUserLogout service",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );
    }
};

export const revokeRefreshToken = async (
    refreshTokenFromUser,
    userId,
    logoutLogger
) => {
    try {
        logoutLogger.info("Searching for active refresh tokens in database");
        const allRefreshTokenFromDB = await RefreshToken.findAll({
            where: { ownerId: userId, isRevoked: false },
        });

        if (!allRefreshTokenFromDB || allRefreshTokenFromDB.length === 0) {
            logoutLogger.warn(
                "No active session found in DB (User might be already logged out/expired)"
            );
            return;
        }
        logoutLogger.info(
            `Found ${allRefreshTokenFromDB.length} active refresh token(s). Starting comparison.`
        );

        let targetTokenID = null;
        for (const tokenRecord of allRefreshTokenFromDB) {
            const isMatch = await bcrypt.compare(
                refreshTokenFromUser,
                tokenRecord.token
            );
            if (isMatch) {
                targetTokenID = tokenRecord.id;
                break;
            }
        }

        if (!targetTokenID) {
            logoutLogger.warn(
                "Logout failed: Provided refresh token did not match any stored tokens for user"
            );
            return;
        }
        logoutLogger.info(
            "Matching refresh token found. Proceeding to revoke."
        );

        await RefreshToken.update(
            { isRevoked: true },
            { where: { id: targetTokenID } }
        );
        logoutLogger.info("Refresh token successfully revoked in database");
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logoutLogger.error(
            "An unexpected error occurred in handleUserLogout service",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );
    }
};

export const revokeRefreshToken2 = async (
    refreshTokenFromUser,
    userId,
    logoutLogger
) => {
    try {
        logoutLogger.info("Initiating refresh token revocation", {
            userId,
            action: "revoke_refresh_token_start",
        });

        const allRefreshTokenFromDB = await RefreshToken.findAll({
            where: { ownerId: userId, isRevoked: false },
        });

        if (!allRefreshTokenFromDB || allRefreshTokenFromDB.length === 0) {
            logoutLogger.warn("No active refresh tokens found", {
                userId,
                action: "no_active_tokens",
                reason: "user_already_logged_out_or_expired",
            });
            return;
        }

        logoutLogger.info("Active refresh tokens retrieved", {
            userId,
            tokenCount: allRefreshTokenFromDB.length,
            action: "tokens_found",
        });

        let targetTokenID = null;
        const startTime = Date.now();

        for (const tokenRecord of allRefreshTokenFromDB) {
            const isMatch = await bcrypt.compare(
                refreshTokenFromUser,
                tokenRecord.token
            );
            if (isMatch) {
                targetTokenID = tokenRecord.id;
                break;
            }
        }

        const comparisonDuration = Date.now() - startTime;

        if (!targetTokenID) {
            logoutLogger.warn("Token mismatch detected", {
                userId,
                action: "token_mismatch",
                comparisonDuration,
                tokensChecked: allRefreshTokenFromDB.length,
                securityNote: "Potential token theft or replay attack",
            });
            return;
        }

        logoutLogger.info("Matching token identified", {
            userId,
            tokenId: targetTokenID,
            comparisonDuration,
            action: "token_matched",
        });

        await RefreshToken.update(
            { isRevoked: true },
            { where: { id: targetTokenID } }
        );

        logoutLogger.info("Refresh token revoked successfully", {
            userId,
            tokenId: targetTokenID,
            action: "revoke_refresh_token_success",
        });
    } catch (error) {
        if (error instanceof AppError) {
            logoutLogger.error("Application error during token revocation", {
                userId,
                action: "revoke_refresh_token_app_error",
                errorType: error.constructor.name,
                errorCode: error.code,
                errorMessage: error.message,
                errorStack:
                    process.env.NODE_ENV === "development"
                        ? error.stack
                        : undefined,
            });
        }

        logoutLogger.error("Unexpected error during token revocation", {
            userId,
            action: "revoke_refresh_token_unexpected_error",
            errorType: error.name,
            errorMessage: error.message,
            errorStack:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : undefined,
        });
    }
};
