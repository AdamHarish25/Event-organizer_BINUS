import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use("/", (req, res) => {
    res.status(404).json({
        error: "Page Not Found Bang !",
        statusCode: 404,
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening on http://localhost:${process.env.PORT}`);
});
