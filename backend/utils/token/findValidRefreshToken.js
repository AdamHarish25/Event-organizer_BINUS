import bcrypt from "bcrypt";

const findValidRefreshToken = async (
    refreshTokenFromUser,
    allRefreshTokenFromDB
) => {
    for (const tokenRecord of allRefreshTokenFromDB) {
        const isMatch = await bcrypt.compare(
            refreshTokenFromUser,
            tokenRecord.token
        );

        if (isMatch) {
            return tokenRecord;
        }
    }
    return null;
};

export default findValidRefreshToken;
