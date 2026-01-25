import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const isTest = process.env.NODE_ENV === "test";
const databaseName = isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME;

console.log(`[DB Config] Mode: ${process.env.NODE_ENV}`);
console.log(`[DB Config] Target DB: ${databaseName}`);

if (isTest && databaseName === process.env.DB_NAME) {
    console.error("\nCRITICAL SAFETY ERROR ");
    console.error(
        "System mendeteksi mode TESTING, tetapi koneksi mengarah ke database UTAMA (Production/Dev).",
    );
    console.error(`Target terdeteksi: ${databaseName}`);
    console.error("Proses dihentikan paksa untuk mencegah penghapusan data.");
    console.error(
        "Check file .env Anda dan pastikan DB_NAME_TEST terisi berbeda dengan DB_NAME.\n",
    );
    process.exit(1);
}

export const sequelize = new Sequelize(
    databaseName,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: "localhost",
        dialect: "mysql",
        logging: isTest ? false : console.log,
    },
);

export async function testDBConnection() {
    try {
        await sequelize.authenticate();
        console.log("✅ Koneksi database berhasil!");
    } catch (error) {
        console.error("❌ Gagal koneksi ke database:", error.message);
    }
}
