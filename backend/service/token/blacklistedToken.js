import db from "../../model/index.js";

const authenticateBlacklistedToken = async (req, res, next) => {
    const BlacklistedTokenModel = db.BlacklistedToken;
    const token = req.headers.authorization.split(" ")[1];

    try {
        const isBlacklisted = await BlacklistedTokenModel.findOne({
            where: { token },
        });

        if (isBlacklisted) {
            return res.status(403).json({ message: "Token has been revoked" });
        }

        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

export default authenticateBlacklistedToken;
