import express from "express";
import { loginValidator, tokenValidator } from "../validator/validator.js";
import {
    login,
    userRegister,
    eventViewer,
} from "../controller/usercontroller.js";
import { authorizeRole } from "../validator/validator.js";
const router = express.Router();

router.post("/login", loginValidator, login);
router.post("/admin-dashboard", authorizeRole("admin"));
router.post("/supadmin-dashboard", authorizeRole("supadmin"));
router.get("/event", tokenValidator, eventViewer);
// router.post("/register", userRegister);
// router.post("/refresh-token", getAccessToken);
// router.delete("/user-delete", deleteUser);

export default router;
