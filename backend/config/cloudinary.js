import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import https from "https";
import dns from "node:dns";
import { ONE_MINUTE } from "../constant/time.constant.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const TIMEOUT = ONE_MINUTE;
export const DNS_SERVERS = ["8.8.8.8", "8.8.4.4"];

export const configureNetworkStrategy = (env = process.env.NODE_ENV) => {
    if (env === "development") {
        try {
            dns.setServers(DNS_SERVERS);
            console.log("Menggunakan Google DNS untuk bypass ISP.");
        } catch (error) {
            console.warn("Gagal set DNS custom, lanjut dengan default.");
        }
    }
};

export const createUploadAgent = () => {
    return new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        timeout: TIMEOUT,
        scheduling: "lifo",
    });
};

configureNetworkStrategy();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
    agent: createUploadAgent(),
    timeout: TIMEOUT,
});

export default cloudinary;
