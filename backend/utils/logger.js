import winston from "winston";
import { SPLAT } from "triple-beam";

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(
    ({ level, message, timestamp, [SPLAT]: metadata }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (metadata && metadata.length > 0) {
            log += ` ${JSON.stringify(metadata, null, 2)}`;
        }
        return log;
    }
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        new winston.transports.File({ filename: "logs/combined.log" }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                consoleFormat
            ),
        })
    );
}

export default logger;
