import bcrypt from "bcrypt";

export default async function saveNewRefreshToken(
    userId,
    newRefreshToken,
    RefreshTokenModel,
    deviceName
) {
    try {
        const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const userRefreshTokens = await RefreshTokenModel.findAll({
            where: { ownerId: userId },
            order: [["expiresAt", "ASC"]],
        });

        const revokedToken = userRefreshTokens.find(
            (token) => token.isRevoked === true
        );

        const tokenData = {
            token: hashedNewRefreshToken,
            isRevoked: false,
            expiresAt,
        };

        if (revokedToken) {
            await RefreshTokenModel.update(tokenData, {
                where: { id: revokedToken.id },
            });
        } else if (userRefreshTokens.length < 3) {
            await RefreshTokenModel.create({
                ...tokenData,
                ownerId: userId,
                device: deviceName,
            });
        } else {
            const oldestToken = userRefreshTokens[0];
            await RefreshTokenModel.update(tokenData, {
                where: { id: oldestToken.id },
            });
        }
    } catch (error) {
        console.error(
            `[RefreshTokenStorage Error] Gagal menyimpan/mengelola token refresh untuk userId ${userId}: `,
            error.message,
            error.stack
        );

        throw new Error("Gagal mengelola penyimpanan refresh token pengguna.");
    }
}
