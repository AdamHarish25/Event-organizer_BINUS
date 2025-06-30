import Joi from "joi";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

export const loginValidatorSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: false } }) // nonaktifkan validasi TLD default
        .lowercase()
        .pattern(/^[a-zA-Z0-9._%+-]+@binus\.ac\.id$/)
        .required()
        .messages({
            "string.email": "Email tidak valid.",
            "string.pattern.base":
                "Email harus menggunakan domain @binus.ac.id.",
            "string.empty": "Email tidak boleh kosong.",
            "any.required": "Email wajib diisi.",
        }),
    password: Joi.string().min(8).max(30).required().messages({
        "string.min": "Password minimal 8 karakter.",
        "string.max": "Password maksimal 30 karakter.",
        "string.empty": "Password tidak boleh kosong.",
        "any.required": "Password wajib diisi.",
    }),
});

export const tokenValidator = (secretKey) => {
    return (req, res, next) => {
        try {
            if (!req.headers.authorization) {
                return res
                    .status(401)
                    .json({ message: "Silahkan login terlebih dahulu." });
            }
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, secretKey);
            req.user = decoded;
            next();
        } catch (error) {
            let errorMessage = "Token tidak valid.";
            if (error.name === "TokenExpiredError") {
                errorMessage = "Token kadaluarsa. Silahkan login kembali.";
            } else if (error.name === "JsonWebTokenError") {
                errorMessage = "Token tidak valid atau format salah.";
            }
            return res.status(401).json({ message: errorMessage });
        }
    };
};

export const refreshTokenValidator = async (
    refreshTokenList,
    requestRefreshToken
) => {
    refreshTokenList.forEach((eachToken) => {
        const isRefreshTokenMatch = bcrypt.compare(
            requestRefreshToken,
            eachToken.token
        );
        if (isRefreshTokenMatch) {
            return true;
        }
    });
    return false;
};

export const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).send("Akses Ditolak !");
        }
        next();
    };
};
