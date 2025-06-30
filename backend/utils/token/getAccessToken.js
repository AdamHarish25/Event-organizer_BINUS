import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
const { ACCESS_JWT_SECRET } = process.env;

export default function getAccessToken(payload) {
    const newAccessToken = jwt.sign(
        payload,
        ACCESS_JWT_SECRET,
        { expiresIn: "15m" },
        { algorithm: "HS256" }
    );
    return newAccessToken;
}
