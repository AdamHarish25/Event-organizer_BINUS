import { sequelize } from "../../config/dbconfig.js";

export default async function globalSetup() {
    try {
        await sequelize.authenticate();
        console.log(
            "Global Setup: Connection has been established successfully.",
        );
        await sequelize.sync({ force: true, logging: false });
        console.log("Global Setup: Database Schema Created");
        await sequelize.close();
    } catch (error) {
        console.error("Global Setup Error:", error);
        process.exit(1);
    }
}
