import bcrypt from "bcrypt";
import getToken from "../../utils/token/getToken.js";
import findValidRefreshToken from "../../utils/token/findValidRefreshToken.js";

const renewAccessToken = async (user, model, oldRefreshToken) => {
    const { RefreshTokenModel } = model;
    try {
        const refreshTokenList = await RefreshTokenModel.findAll({
            where: { ownerId: user.id, isRevoked: false },
        });

        if (refreshTokenList.length == 0) {
            throw new Error("Silahkan login terlebih dahulu !");
        }

        const tokenRecord = await findValidRefreshToken(
            oldRefreshToken,
            refreshTokenList
        );

        if (!tokenRecord) {
            throw new Error("Silahkan login terlebih dahulu !");
        }

        const payload = { id: user.id, role: user.role };
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            getToken(payload);

        const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await RefreshTokenModel.update(
            {
                token: hashedNewRefreshToken,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            },
            {
                where: { ownerId: user.id, token: tokenRecord.token },
            }
        );

        return { newAccessToken, newRefreshToken };
    } catch (error) {
        console.error("Error in renewAccessToken:", error);
        throw new Error("Failed to renew access token");
    }
};

export default renewAccessToken;
