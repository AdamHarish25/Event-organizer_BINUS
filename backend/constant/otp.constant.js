import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const MAX_ATTEMPTS = 3;
export const EXPIRY_MINUTES = 5;
export const RATE_LIMIT_WINDOW = 15;
export const MAX_REQUESTS_PER_WINDOW = 5;
export const BCRYPT_ROUNDS = process.env.NODE_ENV === "test" ? 1 : 10;
export const OTP_LENGTH = 6;
