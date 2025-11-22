import AppError from "../utils/AppError.js";
import { Notification } from "../model/index.js";

export const getNotificationService = async (
    userId,
    pageNum,
    limitNum,
    logger
) => {
    try {
        const offset = (pageNum - 1) * limitNum;

        logger.info("Fetching notifications from database", {
            context: { page: pageNum, limit: limitNum },
        });

        const { count, rows } = await Notification.findAndCountAll({
            where: { recipientId: userId },
            limit: limitNum,
            offset,
            order: [["createdAt", "DESC"]],
        });

        logger.info("Successfully fetched notifications", {
            context: {
                totalItems: count,
                returnedItems: rows.length,
                currentPage: pageNum,
            },
        });

        return {
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limitNum),
                currentPage: pageNum,
                pageSize: limitNum,
            },
        };
    } catch (error) {
        logger.error("Failed to fetch notifications from database", {
            context: { userId, page, limit },
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });

        throw new AppError(
            "Gagal mengambil notifikasi.",
            500,
            "DATABASE_ERROR"
        );
    }
};

export const markAsReadService = async (notificationId, userId, logger) => {
    try {
        logger.info("Attempting to mark notification as read in database");

        const [updatedRows] = await Notification.update(
            { isRead: true },
            {
                where: {
                    id: notificationId,
                    recipientId: userId,
                },
            }
        );

        if (updatedRows === 0) {
            logger.warn(
                "Failed to mark as read: Notification not found or user lacks permission"
            );
            throw new AppError(
                "Notifikasi tidak ditemukan atau Anda tidak berhak mengubahnya.",
                404,
                "NOT_FOUND"
            );
        }

        logger.info("Notification successfully marked as read in database");

        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error("An unexpected error occurred in markAsRead service", {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });

        throw new AppError(
            "Gagal menandai notifikasi sebagai dibaca karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};
