import crypto from "crypto";

export const hashToken = (token) => {
    if (!token || typeof token !== "string") {
        throw new Error("hashToken requires a non-empty string");
    }
    return crypto.createHash("sha256").update(token).digest("hex");
};
