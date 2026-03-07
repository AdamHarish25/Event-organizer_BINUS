import logger from "../utils/logger.js";

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    res.on("finish", () => {
        console.log(`DEBUG: Status = ${res.statusCode}`);
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            userId: req.user?.id ?? null,
        };

        if (res.statusCode >= 500) {
            logger.error("Server error", logData);
        } else if (res.statusCode >= 400) {
            logger.warn("Client error", logData);
        } else {
            logger.info("Request completed", logData);
        }
    });

    next();
};

export default requestLogger;
