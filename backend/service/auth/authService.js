import bcrypt from "bcrypt";
import getToken from "../../utils/token/getToken.js";
import saveNewRefreshToken from "./refreshTokenStorage.js";

export async function handleUserLogin(data, model, deviceName) {
    try {
        const { email, password } = data;
        const { UserModel, RefreshTokenModel } = model;

        const user = await UserModel.findOne({ where: { email } });
        if (!user) {
            const error = new Error("Email atau Password salah.");
            error.type = "CLIENT_AUTH_ERROR";
            throw error;
        }

        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            const error = new Error("Email atau Password salah.");
            error.type = "CLIENT_AUTH_ERROR";
            throw error;
        }

        const payload = { id: user.id, role: user.role };
        const { accessToken, refreshToken } = getToken(payload);

        await saveNewRefreshToken(
            user.id,
            refreshToken,
            RefreshTokenModel,
            deviceName
        );

        const userProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return { user: userProfile, accessToken, refreshToken };
    } catch (error) {
        console.error(
            `[AuthService Error] Gagal login untuk email: ${data.email}:`,
            error.message,
            error.stack
        );

        if (error.type === "CLIENT_AUTH_ERROR") {
            throw error;
        }

        throw new Error(
            "Terjadi kesalahan internal pada server saat proses login."
        );
    }
}

export async function handleUserLogout(token, model, userId) {
    try {
        const { RefreshTokenModel, BlacklistedTokenModel } = model;
        const { accessTokenFromUser, refreshTokenFromUser } = token;

        const allRefreshTokenFromDB = await RefreshTokenModel.findAll({
            where: { ownerId: userId },
        });

        let theRightRefreshToken;
        for (const tokenRecord of allRefreshTokenFromDB) {
            const isMatch = await bcrypt.compare(
                refreshTokenFromUser,
                tokenRecord.token
            );

            if (isMatch) {
                theRightRefreshToken = tokenRecord.token;
                break;
            }
        }

        await RefreshTokenModel.update(
            { isRevoked: true },
            { where: { ownerId: userId, token: theRightRefreshToken } }
        );

        await BlacklistedTokenModel.create({
            token: accessTokenFromUser,
            userId,
            reason: "logout",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
    } catch (error) {
        console.error(
            `[AuthService Error] Gagal logout untuk user ID: ${userId}:`,
            error.message,
            error.stack
        );

        throw new Error("Terjadi kesalahan saat proses logout.");
    }
}
