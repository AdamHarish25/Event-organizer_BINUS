import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
const { REFRESH_JWT_SECRET } = process.env;

export default function getRefreshToken(payload) {
    const newRefreshToken = jwt.sign(
        payload,
        REFRESH_JWT_SECRET,
        { expiresIn: "7d" },
        { algorithm: "HS256" }
    );
    return newRefreshToken;
}
