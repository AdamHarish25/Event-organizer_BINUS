import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { v7 as uuidv7 } from "uuid";
import Student from "../model/student.js";
import Admin from "../model/admin.js";
import SuperAdmin from "../model/superadmin.js";
import Event from "../model/event.js";
import StudentRefreshToken from "../model/token/studentRefreshToken.js";
import AdminRefreshToken from "../model/token/adminRefreshToken.js";
import SuperAdminRefreshToken from "../model/token/superAdminRefreshToken.js";
import { refreshTokenValidator } from "../validator/validator.js";

const { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } = process.env;

dotenv.config({ path: "../.env" });

function getAcessToken(payload) {
    const newAccessToken = jwt.sign(
        payload,
        ACCESS_JWT_SECRET,
        { expiresIn: "15m" },
        { algorithm: "HS256" }
    );
    return newAccessToken;
}

function getRefreshToken(payload) {
    const newRefreshToken = jwt.sign(
        payload,
        REFRESH_JWT_SECRET,
        { expiresIn: "7d" },
        { algorithm: "HS256" }
    );

    return newRefreshToken;
}

function roleIdentify(role) {
    if (role === "student") {
        return {
            userModel: Student,
            refreshTokenModel: StudentRefreshToken,
            associationKey: "studentTokenData",
        };
    }
    if (role === "admin") {
        return {
            userModel: Admin,
            refreshTokenModel: AdminRefreshToken,
            associationKey: "adminTokenData",
        };
    }
    if (role === "superAdmin") {
        return {
            userModel: SuperAdmin,
            refreshTokenModel: SuperAdminRefreshToken,
            associationKey: "superAdminTokenData",
        };
    }
    return false;
}

async function refreshTokenHandler(user, newRefreshToken, refreshTokenModel) {
    try {
        //Enkripsi refresh token agar aman
        const hashedNewRefreshToken = bcrypt.hashSync(newRefreshToken, 10);

        // Jika refresh token belum ada maka simpan refresh token yang baru
        const userRefreshToken = await refreshTokenModel.findAll({
            where: { ownerId: user.id },
            order: [["expiresAt", "ASC"]],
        });

        if (userRefreshToken.length < 3) {
            await refreshTokenModel.create({
                token: hashedNewRefreshToken,
                isRevoked: false,
                ownerId: user.id,
                expiresAt: new Date(
                    new Date().getTime() + 7 * 24 * 60 * 60 * 1000
                ),
            });
            return;
        }

        // Jika token sudah ada di DB maka hanya perlu di-update
        const revokedRefreshToken = await refreshTokenModel.findOne({
            where: { ownerId: user.id, isRevoked: true },
        });

        if (revokedRefreshToken) {
            await refreshTokenModel.update(
                {
                    token: hashedNewRefreshToken,
                    isRevoked: false,
                    expiresAt: new Date(
                        new Date().getTime() + 7 * 24 * 60 * 60 * 1000
                    ),
                },
                { where: { ownerId: user.id, id: revokedRefreshToken.id } }
            );
            return;
        }

        await refreshTokenModel.update(
            {
                token: hashedNewRefreshToken,
                isRevoked: false,
                expiresAt: new Date(
                    new Date().getTime() + 7 * 24 * 60 * 60 * 1000
                ),
            },
            { where: { ownerId: user.id, id: userRefreshToken[0].id } }
        );
    } catch (error) {
        return error;
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        let role = req.query.role.toLowerCase();

        const { userModel, refreshTokenModel, associationKey } =
            roleIdentify(role);

        if (!userModel) {
            throw new Error("Role tidak Valid");
        }

        let user;
        user = await userModel.findOne({ where: { email } });
        if (!user) {
            throw new Error(`Kamu tidak terdaftar sebagai ${role}`);
        }

        const result = bcrypt.compareSync(password, user.password);
        if (!result) {
            throw new Error("Password kamu salah ");
        }

        const payload = { id: user.id, role };
        const newAccessToken = getAcessToken(payload);
        const newRefreshToken = getRefreshToken(payload);

        refreshTokenHandler(user, newRefreshToken, refreshTokenModel);

        res.cookie("access-token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 15,
            path: "/",
        });

        res.cookie("refresh-token", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: "/",
        });

        res.status(200).json({
            message: "Login Success !",
            userId: user.id,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
}

export const refreshAccessToken = async (req, res) => {
    try {
        const { id, role } = req.user;
        const { refreshTokenModel } = roleIdentify(role);
        const refreshTokenList = await refreshTokenModel.findAll({
            where: { ownerId: id, isRevoked: false },
        });

        if (refreshTokenList.length == 0) {
            throw new Error("Silahkan login terlebih dahulu !");
        }

        const requestRefreshToken = req.headers.authorization.split(" ")[1];

        const isRefreshTokenMatch = refreshTokenValidator(
            refreshTokenList,
            requestRefreshToken
        );

        if (!isRefreshTokenMatch) {
            throw new Error("Silahkan login terlebih dahulu !");
        }

        const payload = { id, role };
        const newAccessToken = getAcessToken(payload);
        res.cookie("access-token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 15,
            path: "/",
        });

        res.status(200).json({
            message: "Access Token Sent Successfully !",
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

export const eventViewer = (req, res) => {
    res.send(req.user);
};

export const userRegister = async (req, res) => {
    const { id, firstName, lastName, email, password } = req.body;
    let role = req.query.role;

    const identify = roleIdentify(role.toLowerCase());
    const userModel = identify.userModel;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await userModel.create({
        id,
        firstName,
        lastName,
        email,
        password: hashedPassword,
    });
    return res.status(201).json({ message: "user Created", data: newUser });
};

// user = await userModel.findOne({
//     where: { email },
//     include: {
//         model: refreshTokenModel, // Sertakan data RefreshToken
//         as: associationKey,
//         attributes: ["id", "token", "expiresAt"], // Pilih kolom yang ingin ditampilkan
//         order: [["expiresAt", "ASC"]], // urut dari token terbaru hingga tertua
//     },
// });
