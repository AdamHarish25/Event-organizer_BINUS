import {
    getNotificationService,
    markAsReadService,
} from "../service/notification.service.js";
import db from "../model/index.js";
import logger from "../utils/logger.js";

export const getNotification = async (req, res, next) => {
    const { correlationId, user } = req;
    const controllerLogger = logger.child({
        correlationId,
        source: "NotificationController.getNotification",
        userId: user.id,
    });

    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        controllerLogger.info("Get notifications process initiated", {
            context: { page, limit },
        });

        const result = await getNotificationService(
            user.id,
            page,
            limit,
            db.Notification,
            controllerLogger
        );

        controllerLogger.info("Notifications fetched successfully", {
            context: {
                returnedItems: result.data.length,
                pagination: result.pagination,
            },
        });

        res.status(200).json({
            status: "success",
            ...result,
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `Failed to fetch notifications: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    const { correlationId, user } = req;
    const { notificationId } = req.params;

    const controllerLogger = logger.child({
        correlationId,
        source: "NotificationController.markAsRead",
        userId: user.id,
        context: { notificationId },
    });

    try {
        controllerLogger.info("Mark notification as read process initiated");

        await markAsReadService(
            notificationId,
            user.id,
            db.Notification,
            controllerLogger
        );

        controllerLogger.info("Notification marked as read successfully");

        res.status(200).json({
            status: "success",
            message: "Notification successfully marked as read",
        });
    } catch (error) {
        const logLevel =
            error.statusCode && error.statusCode < 500 ? "warn" : "error";

        controllerLogger[logLevel](
            `Failed to mark notification as read: ${error.message}`,
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    statusCode: error.statusCode,
                },
            }
        );

        next(error);
    }
};
