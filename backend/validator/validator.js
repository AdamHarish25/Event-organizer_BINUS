import Joi from "joi";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

// Validation Scheme
const schema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["id"] } })
        .lowercase()
        .required()
        .messages({
            "string.email": "Email Tidak Valid !",
            "string.empty": "Email harus Diisi !",
            "any.required": "Email Harus Diisi !",
        }),
    password: Joi.string().required().messages({
        "string.empty": "Password Tidak Boleh Kosong !",
        "any.required": "Password Tidak Boleh Kosong !",
    }),
});

//Middleware As Validator
export const loginValidator = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        await schema.validateAsync({ email, password });
        next();
    } catch (error) {
        res.status(401).json({
            message: error.details[0].message,
            statuCode: 401,
        });
    }
};

export const tokenValidator = (secretKey) => {
    return async (req, res, next) => {
        try {
            if (!req.headers.authorization) {
                throw new Error("Silahkan Login Terlebih Dahulu !");
            }
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, secretKey);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    };
};

export const refreshTokenValidator = async (
    refreshTokenList,
    requestRefreshToken
) => {
    refreshTokenList.forEach((eachToken) => {
        const isRefreshTokenMatch = bcrypt.compareSync(
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
