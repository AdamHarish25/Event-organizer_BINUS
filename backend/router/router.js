import express from "express";
import dotenv from "dotenv";
import { loginValidator, tokenValidator } from "../validator/validator.js";
import {
    login,
    userRegister,
    eventViewer,
    refreshAccessToken,
} from "../controller/usercontroller.js";
import { authorizeRole } from "../validator/validator.js";

dotenv.config({ path: "../.env" });
const { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } = process.env;
const router = express.Router();

router.post("/login", loginValidator, login);
router.post("/admin-dashboard", authorizeRole("admin"));
router.post("/supadmin-dashboard", authorizeRole("supadmin"));
router.get("/event", tokenValidator(ACCESS_JWT_SECRET), eventViewer);
router.post(
    "/refresh-token",
    tokenValidator(REFRESH_JWT_SECRET),
    refreshAccessToken
);
// router.post("/register", userRegister);
// router.delete("/user-delete", deleteUser);

export default router;
