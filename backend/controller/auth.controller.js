import bcrypt from "bcrypt";
import { uuidv7 } from "uuidv7";
import dotenv from "dotenv";

import db from "../model/index.js";
import extractDeviceInfo from "../utils/deviceInfo.js";
import { renewAccessToken } from "../service/token.service.js";
import { handleUserLogin, handleUserLogout } from "../service/auth.service.js";
import logger from "../utils/logger.js";
import { SEVEN_DAYS } from "../constant/time.constant.js";

dotenv.config();

export const register = async (req, res, next) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv7();

    const registerLogger = logger.child({
        correlationId: correlationId,
        source: "AuthController.register",
    });

    const { firstName, lastName, studentId, email, password, role } = req.body;

    try {
        registerLogger.info("Registration process started", {
            requestBody: { firstName, lastName, studentId, email, role },
        });

        const existingUser = await db.User.findOne({
            where: {
                email: email,
            },
        });

        if (existingUser) {
            registerLogger.warn("Registration failed: Email already exists", {
                email,
            });
            return res.status(409).json({
                message: "Email sudah terdaftar",
            });
        }

        if (studentId) {
            const existingStudentId = await db.User.findOne({
                where: { studentId },
            });

            if (existingStudentId) {
                registerLogger.warn(
                    "Registration failed: Student ID already exists",
                    {
                        studentId,
                    },
                );
                return res.status(409).json({
                    message: "Student ID sudah terdaftar",
                });
            }
        }

        const saltRounds = process.env.NODE_ENV === "test" ? 1 : 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userData = {
            role,
            firstName,
            lastName,
            email,
            password: hashedPassword,
        };

        if (studentId) {
            userData.studentId = studentId;
        }

        const newUser = await db.User.create(userData);
        const userResponse = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            ...(newUser.studentId && { studentId: newUser.studentId }),
            createdAt: newUser.createdAt,
        };

        registerLogger.info("User registration successful", {
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
        });

        return res.status(201).json({
            message: "User berhasil dibuat",
            data: userResponse,
        });
    } catch (error) {
        registerLogger.error("User registration failed", {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                ...(error.parent && {
                    sqlMessage: error.parent.message,
                    sqlCode: error.parent.code,
                }),
            },
        });

        if (error.name === "SequelizeUniqueConstraintError") {
            const field = error.errors[0]?.path || "field";
            return res.status(409).json({
                message: `${field} sudah terdaftar`,
            });
        }

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                message: "Validasi gagal",
                errors: error.errors.map((e) => ({
                    field: e.path,
                    message: e.message,
                })),
            });
        }

        if (error.name === "SequelizeDatabaseError") {
            if (error.parent && error.parent.code === "ER_DATA_TOO_LONG") {
                const match = error.parent.message.match(/column '(.+?)'/);
                const column = match ? match[1] : "input";

                return res.status(400).json({
                    status: "fail",
                    message: `Data pada '${column}' terlalu panjang.`,
                });
            }

            if (
                error.parent &&
                error.parent.code === "ER_NO_REFERENCED_ROW_2"
            ) {
                return res.status(400).json({
                    status: "fail",
                    message: "Data referensi tidak valid (Foreign Key Error).",
                });
            }

            if (error.name === "Error" && error.message.includes("bcrypt")) {
                return res.status(500).json({
                    status: "error",
                    message:
                        "Terjadi kesalahan enkripsi saat memproses registrasi.",
                });
            }

            next(error);
        }
    }
};

export const login = async (req, res, next) => {
    const { correlationId } = req;

    const loginLogger = logger.child({
        correlationId: correlationId,
        source: "AuthController.login",
    });

    try {
        const data = { email: req.body.email, password: req.body.password };
        const { deviceName } = extractDeviceInfo(req);

        loginLogger.info("Login attempt started", {
            email: data.email,
            deviceName: deviceName,
        });

        const { user, accessToken, refreshToken } = await handleUserLogin(
            data,
            deviceName,
            loginLogger,
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: SEVEN_DAYS,
            path: "/",
        });

        loginLogger.info("User login successful", {
            userId: user.id,
            role: user.role,
        });

        res.status(200).json({
            message: "Login successful",
            user,
            accessToken,
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        loginLogger[logLevel](`Login process failed: ${error.message}`, {
            email: req.body.email,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                statusCode: error.statusCode,
            },
        });

        next(error);
    }
};

export const logout = async (req, res, next) => {
    const { correlationId, user = null } = req;

    const logoutLogger = logger.child({
        correlationId,
        source: "AuthController.logout",
        userId: user?.id ?? "anonymous",
    });

    try {
        logoutLogger.info("Logout process initiated");

        const authHeader = req.headers?.authorization;
        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : null;
        const refreshToken = req.cookies?.refreshToken ?? null;

        const token = {
            accessTokenFromUser: accessToken,
            refreshTokenFromUser: refreshToken,
        };

        if (accessToken || refreshToken) {
            await handleUserLogout(token, user?.id, logoutLogger);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        logoutLogger.info("User logout successful");

        res.status(200).json({
            message: "Logout Successfully.",
        });
    } catch (error) {
        logoutLogger.error("Logout controller encountered unexpected error", {
            error: {
                message: error.message,
                stack: error.stack,
            },
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return res.status(200).json({
            message: "Logout Successfully (Fallback).",
        });
    }
};

export const refreshAccessToken = async (req, res, next) => {
    const { correlationId, user } = req;
    const refreshTokenLogger = logger.child({
        correlationId,
        source: "AuthController.refreshAccessToken",
        userId: user.id,
    });
    const deviceInfo = extractDeviceInfo(req);

    try {
        refreshTokenLogger.info("Access token refresh process initiated");

        const oldRefreshToken = req.cookies?.refreshToken ?? null;
        const { newAccessToken, newRefreshToken } = await renewAccessToken(
            user,
            oldRefreshToken,
            refreshTokenLogger,
            deviceInfo.deviceName,
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: SEVEN_DAYS,
            path: "/",
        });

        refreshTokenLogger.info("Access token refreshed successfully");

        res.status(200).json({
            message: "Access Token Sent Successfully !",
            accessToken: newAccessToken,
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        refreshTokenLogger[logLevel](
            `Failed to refresh access token: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            },
        );

        next(error);
    }
};
