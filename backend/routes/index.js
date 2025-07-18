import express from "express";
import authRoutes from "./auth.routes.js";
import passwordRoutes from "./password.routes.js";
import userRoutes from "./user.routes.js";
import eventRoutes from "./event.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/password", passwordRoutes);
router.use("/event", eventRoutes);
router.use("/users", userRoutes);

export default router;
