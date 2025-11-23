import AppError from "../../utils/AppError.js";
import { createAndEmitNotification } from "../notification.service.js";
import { sequelize } from "../../config/dbconfig.js";
import { Event } from "../../model/index.js";

export const rejectEventService = async (
    eventId,
    superAdminId,
    feedback,
    logger
) => {
    try {
        logger.info("Event rejection process started in service");

        logger.info("Starting database transaction");
        await sequelize.transaction(async (t) => {
            const event = await Event.findOne({
                where: { id: eventId, status: ["pending", "revised"] },
                transaction: t,
            });

            if (!event) {
                logger.warn(
                    "Rejection failed: Event not found or its status was not pending/revised"
                );
                throw new AppError(
                    "Data event tidak ditemukan atau sudah diproses",
                    404,
                    "NOT_FOUND"
                );
            }
            logger.info("Event to be rejected found in database", {
                context: { currentStatus: event.status },
            });

            await event.update({ status: "rejected" }, { transaction: t });
            logger.info("Event status successfully updated to 'rejected'");

            await createAndEmitNotification({
                eventId: event.id,
                senderId: superAdminId,
                recipientId: event.creatorId,
                notificationType: "event_rejected",
                feedback,
                payload: {
                    eventName: event.eventName,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
                socketConfig: {
                    title: "Your Request has been REJECTED",
                    message: "Please review the provided Feedback.",
                },
                transaction: t,
                logger,
            });
        });

        logger.info("Database transaction committed successfully");
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error("An unexpected error occurred in rejectEvent service", {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });

        throw new AppError(
            "Gagal menolak event karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};

export const approveEventService = async (eventId, superAdminId, logger) => {
    try {
        logger.info("Event approval process started in service");

        logger.info("Starting database transaction");
        await sequelize.transaction(async (t) => {
            const event = await Event.findOne({
                where: { id: eventId, status: ["pending", "revised"] },
                transaction: t,
            });

            if (!event) {
                logger.warn(
                    "Approval failed: Event not found or its status was not pending/revised"
                );
                throw new AppError(
                    "Data event tidak ditemukan atau sudah diproses",
                    404,
                    "NOT_FOUND"
                );
            }
            logger.info("Event to be approved found in database", {
                context: { currentStatus: event.status },
            });

            await event.update({ status: "approved" }, { transaction: t });
            logger.info("Event status successfully updated to 'approved'");

            await createAndEmitNotification({
                eventId: event.id,
                senderId: superAdminId,
                recipientId: event.creatorId,
                notificationType: "event_approved",
                payload: {
                    eventName: event.eventName,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
                socketConfig: {
                    title: "Your Request has been APPROVED",
                    message: `Congratulations! Your event "${event.eventName}" has been approved.`,
                },
                transaction: t,
                logger,
            });
        });
        logger.info("Database transaction committed successfully");
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error("An unexpected error occurred in approveEvent service", {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });

        throw new AppError(
            "Gagal menyetujui event karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};

export const submitEventFeedbackService = async (
    eventId,
    superAdminId,
    feedback,
    logger
) => {
    try {
        logger.info("Feedback sending process started in service");

        logger.info("Starting database transaction");
        await sequelize.transaction(async (t) => {
            const event = await Event.findByPk(eventId, {
                transaction: t,
            });

            if (!event) {
                logger.warn("Feedback failed: Event not found in database");
                throw new AppError("Event tidak ditemukan", 404, "NOT_FOUND");
            }

            logger.info(
                "Event found, proceeding to update status to 'revised'"
            );

            await event.update({ status: "revised" }, { transaction: t });
            logger.info("Event status successfully updated to 'revised'");

            await createAndEmitNotification({
                eventId,
                senderId: superAdminId,
                recipientId: event.creatorId,
                notificationType: "event_revised",
                feedback,
                payload: {
                    eventName: event.eventName,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
                socketConfig: {
                    title: "Your Request requires REVISION",
                    message: "Please review the provided Feedback",
                },
                transaction: t,
                logger,
            });
        });

        logger.info("Database transaction committed successfully");
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        logger.error("An unexpected error occurred in sendFeedback service", {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });

        throw new AppError(
            "Gagal mengirim feedback karena masalah internal.",
            500,
            "INTERNAL_SERVER_ERROR"
        );
    }
};
