import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const getAccessToken = (payload) => {
    const { ACCESS_JWT_SECRET } = process.env;
    if (!ACCESS_JWT_SECRET) {
        throw new Error("ACCESS_JWT_SECRET is not defined in .env");
    }
    const newAccessToken = jwt.sign(payload, ACCESS_JWT_SECRET, {
        expiresIn: "15m",
        algorithm: "HS256",
    });
    return newAccessToken;
};

const getRefreshToken = (payload) => {
    const { REFRESH_JWT_SECRET } = process.env;
    if (!REFRESH_JWT_SECRET) {
        throw new Error("REFRESH_JWT_SECRET is not defined in .env");
    }
    const uniquePayload = { ...payload, jti: crypto.randomUUID() };
    const newRefreshToken = jwt.sign(uniquePayload, REFRESH_JWT_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
    });
    return newRefreshToken;
};

export default function getToken(payload) {
    return {
        accessToken: getAccessToken(payload),
        refreshToken: getRefreshToken(payload),
    };
}
