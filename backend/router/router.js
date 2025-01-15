import express from "express";
import userController from "../controller/usercontroller.js";
import validator from "../validator/validator.js";
const { login } = userController;
const { loginValidator } = validator;

const router = express.Router();

router.post("/login", loginValidator, login);

export default router;
