import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { v7 as uuidv7 } from "uuid";
import Student from "../model/student.js";
import Admin from "../model/admin.js";
import SuperAdmin from "../model/superadmin.js";
import Event from "../model/event.js";
const { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } = process.env;

dotenv.config({ path: "../.env" });

function tokenGenerator(payload) {
    const accessToken = jwt.sign(
        payload,
        ACCESS_JWT_SECRET,
        { expiresIn: "15m" },
        { algorithm: "HS256" }
    );

    const refreshToken = jwt.sign(
        payload,
        REFRESH_JWT_SECRET,
        { expiresIn: "7d" },
        { algorithm: "HS256" }
    );

    return { accessToken, refreshToken };
}

function roleIdentify(role) {
    if (role === "student") {
        return Student;
    }
    if (role === "admin") {
        return Admin;
    }
    if (role === "supadmin") {
        return SuperAdmin;
    }
    return false;
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        let role = req.query.role;

        const model = roleIdentify(role.toLowerCase());
        if (!model) {
            throw new Error("Role tidak Valid");
        }

        const user = await model.findOne({ where: { email } });
        if (!user) {
            throw new Error(`Kamu tidak terdaftar sebagai ${role}`);
        }

        const result = bcrypt.compareSync(password, user.password);
        if (!result) {
            throw new Error("Password kamu salah ");
        }

        const payload = { id: user.id, role };
        const { accessToken, refreshToken } = tokenGenerator(payload);

        res.cookie("access-token", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 15,
            path: "/",
        });

        res.cookie("refresh-token", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: "/",
        });

        res.status(200).json({ message: "Login Success !" });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};

export const tester = (req, res) => {
    console.log(req.session);
    res.json({ message: "success" });
};

export const eventViewer = (req, res) => {
    res.send(req.user);
};

export const userRegister = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    let role = req.query.role;

    const model = roleIdentify(role.toLowerCase());
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await model.create({
        id: uuidv7(),
        firstName,
        lastName,
        email,
        password: hashedPassword,
    });
    return res.status(201).json({ message: "user Created", data: newUser });
};
