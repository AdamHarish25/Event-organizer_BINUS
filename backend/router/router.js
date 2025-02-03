import express from "express";
import { loginValidator, tokenValidator } from "../validator/validator.js";
import {
    login,
    tester,
    userRegister,
    eventViewer,
} from "../controller/usercontroller.js";
import { authorizeRole } from "../validator/validator.js";
const router = express.Router();

router.post("/login", loginValidator, login);
router.post("/admin", authorizeRole("admin"));
router.post("/supadmin", authorizeRole("supadmin"));
// router.get("/event", tokenValidator, eventViewer);
// router.post("/register", userRegister);

export default router;
