import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: "localhost",
        dialect: "mysql",
    }
);

export default sequelize;
