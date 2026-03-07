import winston from "winston";
import { SPLAT } from "triple-beam";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const isProduction = process.env.NODE_ENV === "production";
const isTesting = process.env.NODE_ENV === "test";
const logDirectory = path.join(process.cwd(), "logs");

const SENSITIVE_FIELDS = [
    "password",
    "token",
    "authorization",
    "secret",
    "creditCard",
    "cvv",
];

const sanitize = winston.format((info) => {
    const sanitizeObject = (obj) => {
        if (typeof obj !== "object" || obj === null) return obj;

        if (Array.isArray(obj)) {
            return obj.map((item) => sanitizeObject(item));
        }

        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            const isSensitive = SENSITIVE_FIELDS.some((f) =>
                key.toLowerCase().includes(f.toLowerCase()),
            );
            newObj[key] = isSensitive ? "[REDACTED]" : sanitizeObject(value);
        }
        return newObj;
    };

    const sanitizedInfo = sanitizeObject(info);

    const symbols = Object.getOwnPropertySymbols(info);
    for (const sym of symbols) {
        sanitizedInfo[sym] = info[sym];
    }

    return sanitizedInfo;
});

const consoleFormat = printf(
    ({ level, message, timestamp, stack, [SPLAT]: metadata }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) log += `\n${stack}`;
        if (metadata && metadata.length > 0) {
            log += ` ${JSON.stringify(metadata, null, 2)}`;
        }
        return log;
    },
);

const rotateOptions = (filename, level = null) => ({
    filename: path.join(logDirectory, filename),
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
    zippedArchive: true,
    ...(level && { level }),
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? "warn" : "debug"),
    silent: isTesting,
    format: combine(errors({ stack: true }), sanitize(), timestamp(), json()),
    transports: [
        new DailyRotateFile(rotateOptions("error-%DATE%.log", "error")),
        new DailyRotateFile(rotateOptions("combined-%DATE%.log")),
    ],
    exceptionHandlers: [
        new DailyRotateFile(rotateOptions("exceptions-%DATE%.log")),
    ],
    rejectionHandlers: [
        new DailyRotateFile(rotateOptions("rejections-%DATE%.log")),
    ],
    exitOnError: false,
});

if (!isProduction && !isTesting) {
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                consoleFormat,
            ),
        }),
    );
}

export default logger;
