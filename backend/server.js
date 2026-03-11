import dotenv from "dotenv";
import app from "./app.js";
import { testDBConnection } from "./config/dbconfig.js";
import { checkEmailConnection } from "./utils/emailSender.js";
import socketService from "./socket/index.js";
import http from "http";
import logger from "./utils/logger.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const getServerAddress = (server) => {
    const addr = server.address();
    if (!addr) return "unknown";
    if (typeof addr === "string") return addr;

    if (NODE_ENV === "production" && process.env.APP_URL) {
        return process.env.APP_URL;
    }

    return `http://localhost:${addr.port}`;
};

const startServer = async () => {
    try {
        await checkEmailConnection();
        await testDBConnection();

        const server = http.createServer(app);
        socketService.init(server);

        server.listen(PORT, () => {
            logger.info(
                `[${NODE_ENV.toUpperCase()}] Server running at ${getServerAddress(server)}`,
            );
        });

        const shutdown = (signal) => {
            logger.warn(`Received ${signal}. Shutting down gracefully...`);
            server.close(() => {
                logger.info("HTTP server closed.");
                process.exit(0);
            });

            setTimeout(() => {
                logger.error("Forced shutdown after timeout.");
                process.exit(1);
            }, 10_000);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        process.on("unhandledRejection", (reason, promise) => {
            logger.error("Unhandled Rejection at:", { promise, reason });
        });

        process.on("uncaughtException", (error) => {
            logger.error("Uncaught Exception:", { error });
            shutdown("uncaughtException");
        });
    } catch (error) {
        logger.error("Failed to start server:", { error });
        process.exit(1);
    }
};

startServer();
