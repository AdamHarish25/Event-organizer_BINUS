import dotenv from "dotenv";
import app from "./app.js";
import { testDBConnection } from "./config/dbconfig.js";
import { checkEmailConnection } from "./utils/emailSender.js";

dotenv.config();

const startServer = async () => {
    try {
        await checkEmailConnection();
        await testDBConnection();

        app.listen(process.env.PORT, () => {
            console.log(
                `Server listening on http://localhost:${process.env.PORT}`
            );
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();
