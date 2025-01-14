import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./router/router.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(router);
app.use("/", (req, res) => {
    res.status(404).json({
        error: "Page Not Found Bang !",
        statusCode: 404,
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening on http://localhost:${process.env.PORT}`);
});
