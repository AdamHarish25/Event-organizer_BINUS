import bcrypt from "bcrypt";
import db from "../model/index.js";
import extractDeviceInfo from "../utils/deviceInfo.js";
import renewAccessToken from "../service/auth/renewAccessToken.js";
import {
    handleUserLogin,
    handleUserLogout,
} from "../service/auth/authService.js";

export const refreshAccessToken = async (req, res) => {
    try {
        const model = { RefreshTokenModel: db.RefreshToken };
        const oldRefreshToken = req.cookies.refreshToken;

        if (!oldRefreshToken) {
            throw new Error("Refresh token tidak ditemukan");
        }

        const { newAccessToken, newRefreshToken } = await renewAccessToken(
            req.user,
            model,
            oldRefreshToken
        );

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: "/",
        });

        res.status(200).json({
            message: "Access Token Sent Successfully !",
            accessToken: newAccessToken,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

export async function login(req, res) {
    try {
        const data = { email: req.body.email, password: req.body.password };
        const model = {
            UserModel: db.User,
            RefreshTokenModel: db.RefreshToken,
        };

        const { deviceName } = extractDeviceInfo(req);

        const { user, accessToken, refreshToken } = await handleUserLogin(
            data,
            model,
            deviceName
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: "/",
        });

        res.status(200).json({
            message: "Login Success !",
            userId: user.id,
            accessToken,
        });
    } catch (error) {
        console.error("Error in login endpoint:", error);

        if (error.type === "CLIENT_AUTH_ERROR") {
            return res.status(401).json({ message: error.message });
        }

        return res
            .status(500)
            .json({ message: "Gagal login. Silakan coba lagi nanti." });
    }
}

export async function logout(req, res) {
    try {
        const accessToken = req.headers.authorization.split(" ")[1];
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new Error("Unauthorized");
        }

        const model = {
            RefreshTokenModel: db.RefreshToken,
            BlacklistedTokenModel: db.BlacklistedToken,
        };

        const token = {
            accessTokenFromUser: accessToken,
            refreshTokenFromUser: refreshToken,
        };

        await handleUserLogout(token, model, req.user.id);

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
        });

        res.status(200).json({
            message: "Logout Successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: error.message,
        });
    }
}

export const eventViewer = (req, res) => {
    res.json({
        message: "Event Viewer",
        user: req.user,
    });
};

export const userRegister = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.User.create({
            role,
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });
        return res.status(201).json({ message: "user Created", data: newUser });
    } catch (error) {
        console.error(error);
    }
};
