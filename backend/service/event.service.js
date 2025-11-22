import { uuidv7 } from "uuidv7";
import { startOfToday, endOfToday, endOfWeek } from "date-fns";
import { Op } from "sequelize";
import AppError from "../utils/AppError.js";
import {
    generateEventAssetPaths,
    getFolderPathFromPublicId,
} from "../utils/pathHelper.js";
import {
    uploadPosterImage,
    deleteSingleFile,
    deleteEventFolder,
} from "./upload.service.js";
import { sequelize } from "../config/dbconfig.js";
import socketService from "../socket/index.js";
import { Event, User, Notification } from "../model/index.js";

export const getCategorizedEventsService = async ({ logger }) => {
    try {
        logger.info("Fetching categorized events from database");

        const commonOptions = {
            where: { status: "approved" },
            order: [
                ["date", "ASC"],
                ["startTime", "ASC"],
            ],
            attributes: [
                "id",
                "eventName",
                "description",
                "date",
                "startTime",
                "endTime",
                "location",
                "speaker",
                "imageUrl",
            ],
        };

        const today = new Date();

        const [currentEvents, thisWeekEvents, nextEvents] = await Promise.all([
            Event.findAll({
                ...commonOptions,
                where: {
                    ...commonOptions.where,
                    date: { [Op.eq]: startOfToday() },
                },
            }),
            Event.findAll({
                ...commonOptions,
                where: {
                    ...commonOptions.where,
                    date: {
                        [Op.gt]: endOfToday(),
                        [Op.lte]: endOfWeek(today, { weekStartsOn: 1 }),
                    },
                },
            }),
            Event.findAll({
                ...commonOptions,
                where: {
                    ...commonOptions.where,
                    date: { [Op.gt]: endOfWeek(today, { weekStartsOn: 1 }) },
                },
            }),
        ]);

        logger.info("Successfully fetched categorized events", {
            context: {
                resultCounts: {
                    current: currentEvents.length,
                    thisWeek: thisWeekEvents.length,
                    next: nextEvents.length,
                },
            },
        });

        return {
            current: currentEvents,
            thisWeek: thisWeekEvents,
            next: nextEvents,
        };
    } catch (error) {
        logger.error(
            "Failed to fetch categorized events due to a database error",
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal mengambil data event.",
            500,
            "DATABASE_ERROR"
        );
    }
};

export const getPaginatedEventsService = async (options) => {
    const { userId, role, page, limit, logger } = options;

    try {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        logger.info("Fetching paginated events from database", {
            context: { role, page: pageNum, limit: limitNum },
        });

        const whereClause = {};
        if (role === "admin") {
            whereClause.creatorId = userId;
            logger.info(
                "Applying filter for admin role: fetching own events only",
                {
                    context: { creatorId: userId },
                }
            );
        }

        const { count, rows } = await Event.findAndCountAll({
            where: whereClause,
            limit: limitNum,
            offset,
            order: [["createdAt", "DESC"]],
        });

        logger.info("Successfully fetched paginated events", {
            context: {
                role,
                pagination: {
                    totalItems: count,
                    returnedItems: rows.length,
                    currentPage: pageNum,
                },
            },
        });

        return {
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limitNum),
                currentPage: pageNum,
            },
        };
    } catch (error) {
        logger.error(
            "Failed to fetch paginated events due to a database error",
            {
                context: { role, page, limit },
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            }
        );

        throw new AppError(
            "Gagal mengambil daftar event.",
            500,
            "DATABASE_ERROR"
        );
    }
};

export const saveNewEventAndNotify = async (userId, data, file, logger) => {
    const {
        eventName,
        date,
        startTime,
        endTime,
        location,
        speaker,
        description,
    } = data;
    const eventId = uuidv7();
    const { fullFolderPath, fileName } = generateEventAssetPaths(eventId);

    let uploadResult;
    try {
        logger.info("Event creation and notification process started");

        logger.info("Attempting to upload poster image to cloud storage", {
            context: { folder: fullFolderPath, fileName },
        });
        uploadResult = await uploadPosterImage(
            file.buffer,
            {
                folder: fullFolderPath,
                public_id: fileName,
            },
            logger
        );
        logger.info("Image uploaded successfully", {
            context: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            },
        });

        let creatorName;
        logger.info("Starting database transaction");
        const newEvent = await sequelize.transaction(async (t) => {
            const [creator, superAdmins] = await Promise.all([
                User.findByPk(userId, {
                    attributes: ["firstName"],
                    transaction: t,
                }),
                User.findAll({
                    where: { role: "super_admin" },
                    attributes: ["id"],
                    transaction: t,
                }),
            ]);

            if (!creator) {
                logger.warn(
                    "Event creation failed: Creator user not found in database"
                );
                throw new AppError(
                    "User tidak ditemukan",
                    404,
                    "USER_NOT_FOUND"
                );
            }
            creatorName = creator.firstName;
            logger.info("Creator and super admins fetched successfully", {
                context: { superAdminCount: superAdmins.length },
            });

            const event = await Event.create(
                {
                    id: eventId,
                    creatorId: userId,
                    eventName,
                    date,
                    startTime,
                    endTime,
                    location,
                    speaker,
                    description,
                    status: "pending",
                    imageUrl: uploadResult.secure_url,
                    imagePublicId: uploadResult.public_id,
                },
                { transaction: t }
            );
            logger.info("Event record created successfully in database", {
                context: { eventId: event.id },
            });

            const superAdminNotifications = superAdmins.map((supAdmin) => ({
                eventId: event.id,
                senderId: userId,
                recipientId: supAdmin.id,
                notificationType: "event_created",
                payload: {
                    eventName,
                    startTime,
                    date,
                    location,
                    speaker,
                    imageUrl: event.imageUrl,
                },
            }));

            const creatorNotification = {
                eventId: event.id,
                senderId: userId,
                recipientId: userId,
                notificationType: "event_pending",
                payload: {
                    eventName,
                    startTime,
                    date,
                    location,
                    speaker,
                    imageUrl: event.imageUrl,
                },
            };
            const allNotifications = [
                ...superAdminNotifications,
                creatorNotification,
            ];

            await Notification.bulkCreate(allNotifications, {
                transaction: t,
            });
            logger.info("Notification records bulk-created successfully", {
                context: { notificationCount: allNotifications.length },
            });

            return event;
        });
        logger.info("Database transaction committed successfully");

        const io = socketService.getIO();
        io.to("super_admin-room").emit("new_notification", {
            type: "event_created",
            title: "A new request has been submitted",
            message: `${creatorName} has submitted a request for the event: ${newEvent.eventName}. Please review it.`,
            isRead: false,
            data: newEvent,
        });

        io.to(userId).emit("new_notification", {
            type: "event_pending",
            title: "Your Request is currently PENDING",
            message: "We will inform you of the outcome as soon as possible.",
            isRead: false,
            data: newEvent,
        });

        logger.info("Socket notifications emitted to rooms", {
            context: { rooms: ["super_admin-room", userId] },
        });

        return newEvent;
    } catch (error) {
        if (uploadResult) {
            logger.warn(
                "Database operation failed. Rolling back: deleting uploaded image to prevent orphans.",
                {
                    context: {
                        publicId: uploadResult.public_id,
                        reason: error.message,
                    },
                }
            );

            deleteSingleFile(uploadResult.public_id, logger).catch(
                (deleteErr) => {
                    logger.error(
                        "Failed to delete orphaned file from cloud storage during rollback",
                        {
                            context: { publicId: uploadResult.public_id },

                            error: {
                                message: deleteErr.message,
                                stack: deleteErr.stack,
                            },
                        }
                    );
                }
            );
        }

        if (!(error instanceof AppError)) {
            logger.error(
                "An unexpected error occurred in saveNewEventAndNotify service",
                {
                    error: {
                        message: error.message,
                        stack: error.stack,
                        name: error.name,
                    },
                }
            );
        }

        throw error;
    }
};

export const handleDeleteEvent = async (adminId, eventId, logger) => {
    let eventDataForCleanupAndNotify;
    let adminName;

    try {
        logger.info("Starting event deletion process in service");
        logger.info("Starting database transaction for event deletion");

        await sequelize.transaction(async (t) => {
            const event = await Event.findOne({
                where: { id: eventId, creatorId: adminId },
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["firstName"],
                    },
                ],
                transaction: t,
            });

            if (!event) {
                logger.warn(
                    "Deletion failed: Event not found or user lacks permission"
                );

                throw new AppError(
                    "Event tidak ditemukan atau Anda tidak berhak menghapusnya.",
                    404,
                    "NOT_FOUND"
                );
            }

            logger.info(
                "Event found in database. Proceeding with deletion logic."
            );

            const superAdmins = await User.findAll({
                where: { role: "super_admin" },
                attributes: ["id"],
                transaction: t,
            });

            eventDataForCleanupAndNotify = event.toJSON();
            adminName = event.creator.firstName;

            const notifications = superAdmins.map((superAdmin) => ({
                eventId: eventDataForCleanupAndNotify.id,
                senderId: adminId,
                recipientId: superAdmin.id,
                notificationType: "event_deleted",
                payload: {
                    eventName: eventDataForCleanupAndNotify.eventName,
                    startTime: eventDataForCleanupAndNotify.startTime,
                    endTime: eventDataForCleanupAndNotify.endTime,
                    date: eventDataForCleanupAndNotify.date,
                    location: eventDataForCleanupAndNotify.location,
                    speaker: eventDataForCleanupAndNotify.speaker,
                    imageUrl: eventDataForCleanupAndNotify.imageUrl,
                },
            }));

            await Notification.bulkCreate(notifications, {
                transaction: t,
            });

            logger.info(
                `Notification records created for ${superAdmins.length} super admins about the deletion`
            );

            await event.destroy({ transaction: t });
            logger.info("Event record successfully deleted from database");
        });
        logger.info("Database transaction committed successfully");

        if (eventDataForCleanupAndNotify?.imagePublicId) {
            logger.info(
                "Event has an associated image. Starting cloud cleanup process.",
                {
                    context: {
                        publicId: eventDataForCleanupAndNotify.imagePublicId,
                    },
                }
            );

            try {
                const folderPath = getFolderPathFromPublicId(
                    eventDataForCleanupAndNotify.imagePublicId,
                    logger
                );

                if (folderPath) {
                    await deleteEventFolder(folderPath, logger);
                    logger.info(
                        "Cloud folder and associated assets deleted successfully",
                        { context: { folderPath } }
                    );
                } else {
                    logger.warn(
                        "Could not determine folder path from publicId, skipping cloud deletion.",
                        {
                            context: {
                                publicId:
                                    eventDataForCleanupAndNotify.imagePublicId,
                            },
                        }
                    );
                }
            } catch (cloudError) {
                logger.error(
                    "Cloud asset cleanup failed after successful DB deletion. Manual cleanup may be required.",
                    {
                        context: {
                            publicId:
                                eventDataForCleanupAndNotify.imagePublicId,
                        },
                        error: {
                            message: cloudError.message,
                            stack: cloudError.stack,
                        },
                    }
                );
            }
        } else {
            logger.info(
                "Event has no associated image. Skipping cloud cleanup."
            );
        }

        if (eventDataForCleanupAndNotify) {
            const io = socketService.getIO();
            io.to("super_admin-room").emit("new_notification", {
                type: "event_deleted",
                title: `Event "${eventDataForCleanupAndNotify.eventName}" has been deleted.`,
                message: `${adminName} removed this event from the system. No further action is required`,
                data: eventDataForCleanupAndNotify,
            });
            logger.info(
                "Socket notification for event deletion emitted successfully"
            );
        }

        return true;
    } catch (dbError) {
        if (!(dbError instanceof AppError)) {
            logger.error(
                "An unexpected error occurred during the database transaction for event deletion",
                {
                    error: {
                        message: dbError.message,
                        stack: dbError.stack,
                        name: dbError.name,
                    },
                }
            );
        }
        throw dbError;
    }
};

export const sendFeedback = async (eventId, superAdminId, feedback, logger) => {
    try {
        logger.info("Feedback sending process started in service");

        logger.info("Starting database transaction");
        const newNotification = await sequelize.transaction(async (t) => {
            const event = await Event.findByPk(eventId, {
                transaction: t,
            });

            console.log(eventId);

            if (!event) {
                logger.warn("Feedback failed: Event not found in database");
                throw new AppError("Event tidak ditemukan", 404, "NOT_FOUND");
            }

            logger.info(
                "Event found, proceeding to update status to 'revised'"
            );

            await event.update({ status: "revised" }, { transaction: t });
            logger.info("Event status successfully updated to 'revised'");

            const notificationData = {
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
            };

            const createdNotification = await Notification.create(
                notificationData,
                { transaction: t }
            );

            logger.info(
                "Notification record with feedback created successfully"
            );

            return createdNotification;
        });

        logger.info("Database transaction committed successfully");

        const io = socketService.getIO();
        io.to(newNotification.recipientId).emit("new_notification", {
            type: "event_revised",
            title: "Your Request requires REVISION",
            message: "Please review the provided Feedback",
            data: newNotification,
        });

        logger.info("Socket notification for feedback sent successfully", {
            context: { recipientId: newNotification.recipientId },
        });

        return newNotification;
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

export const editEventService = async (
    eventId,
    adminId,
    data,
    image,
    logger
) => {
    let uploadResult;
    try {
        logger.info("Event update process started in service", {
            context: { eventId },
        });

        if (image) {
            const { fullFolderPath, fileName } =
                generateEventAssetPaths(eventId);
            logger.info("New image provided. Attempting to upload...", {
                context: { folder: fullFolderPath },
            });
            uploadResult = await uploadPosterImage(image.buffer, {
                folder: fullFolderPath,
                public_id: fileName,
            });
            logger.info("New image uploaded successfully", {
                context: { url: uploadResult.secure_url },
            });
        } else {
            logger.info(
                "No new image provided, proceeding with data update only"
            );
        }

        logger.info("Starting database transaction");
        const updatedEvent = await sequelize.transaction(async (t) => {
            const event = await Event.findOne({
                where: { id: eventId, creatorId: adminId },
                transaction: t,
            });

            if (!event) {
                logger.warn(
                    "Update failed: Event not found or user lacks permission",
                    { context: { eventId, attemptedByUserId: adminId } }
                );
                throw new AppError(
                    "Event tidak ditemukan atau Anda tidak berhak mengubahnya.",
                    404,
                    "NOT_FOUND"
                );
            }
            logger.info("Event found in database. Proceeding with update.");

            const allowedUpdates = {
                eventName: data.eventName,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                location: data.location,
                speaker: data.speaker,
                description: data.description,
            };

            Object.keys(allowedUpdates).forEach(
                (key) =>
                    allowedUpdates[key] === undefined &&
                    delete allowedUpdates[key]
            );

            logger.info("Applying updates to event record", {
                context: { eventId, updates: allowedUpdates },
            });

            await event.update(
                { ...allowedUpdates, status: "pending" },
                { transaction: t }
            );

            logger.info("Event record updated successfully in database");

            const superAdmins = await User.findAll({
                where: { role: "super_admin" },
                attributes: ["id"],
                transaction: t,
            });

            const updatedPayloadData = { ...event.dataValues };

            console.log("Event.DataValuesnya adalah: ", event.dataValues);
            console.log("Allowed Updatesnya adalah: ", allowedUpdates);

            console.log("Hasil Payload datanya adalah : ", updatedPayloadData);
            const notifications = superAdmins.map((superAdmin) => ({
                eventId: event.id,
                senderId: adminId,
                recipientId: superAdmin.id,
                notificationType: "event_updated",
                payload: {
                    eventName: updatedPayloadData.eventName,
                    startTime: updatedPayloadData.startTime,
                    endTime: updatedPayloadData.endTime,
                    date: updatedPayloadData.date,
                    location: updatedPayloadData.location,
                    speaker: updatedPayloadData.speaker,
                    imageUrl: updatedPayloadData.imageUrl,
                },
            }));

            notifications.push({
                eventId: event.id,
                senderId: adminId,
                recipientId: adminId,
                notificationType: "event_pending",
                payload: {
                    eventName: updatedPayloadData.eventName,
                    startTime: updatedPayloadData.startTime,
                    endTime: updatedPayloadData.endTime,
                    date: updatedPayloadData.date,
                    location: updatedPayloadData.location,
                    speaker: updatedPayloadData.speaker,
                    imageUrl: updatedPayloadData.imageUrl,
                },
            });

            await Notification.bulkCreate(notifications, {
                transaction: t,
            });

            logger.info(
                "Notification records for event update created successfully",
                { context: { notificationCount: notifications.length } }
            );

            return event;
        });

        logger.info("Database transaction committed successfully");

        const io = socketService.getIO();
        io.to("super_admin-room").emit("eventUpdated", {
            message: `Event "${updatedEvent.eventName}" telah diperbarui dan menunggu persetujuan.`,
            data: updatedEvent,
        });

        io.to(updatedEvent.creatorId).emit("new_notification", {
            type: "event_pending",
            title: "Your Request is currently PENDING",
            message: "We will inform you of the outcome as soon as possible.",
            isRead: false,
            data: updatedEvent,
        });

        logger.info(
            "Socket notifications for event update emitted successfully"
        );

        return updatedEvent;
    } catch (error) {
        if (uploadResult) {
            logger.warn(
                "Database operation failed. Rolling back: deleting uploaded image.",
                {
                    context: {
                        publicId: uploadResult.public_id,
                        reason: error.message,
                    },
                }
            );

            deleteSingleFile(uploadResult.public_id).catch((deleteErr) => {
                logger.error(
                    "Failed to delete orphaned file from cloud during rollback",
                    {
                        context: { publicId: uploadResult.public_id },

                        error: {
                            message: deleteErr.message,
                            stack: deleteErr.stack,
                        },
                    }
                );
            });
        }

        if (!(error instanceof AppError)) {
            logger.error("An unexpected error occurred in editEventService", {
                context: { eventId },

                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
            });
        }

        throw error;
    }
};

export const rejectEventService = async (
    eventId,
    superAdminId,
    feedback,
    logger
) => {
    try {
        logger.info("Event rejection process started in service");

        logger.info("Starting database transaction");
        const newNotification = await sequelize.transaction(async (t) => {
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

            const notificationData = {
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
            };

            const createdNotification = await Notification.create(
                notificationData,
                { transaction: t }
            );

            logger.info(
                "Notification record for event rejection created successfully",
                { context: { feedbackProvided: !!feedback } }
            );

            return createdNotification;
        });

        logger.info("Database transaction committed successfully");

        const io = socketService.getIO();
        io.to(newNotification.recipientId).emit("new_notification", {
            type: "event_rejected",
            title: "Your Request has been REJECTED",
            message: "Please review the provided Feedback.",
            data: newNotification,
        });

        logger.info(
            "Socket notification for event rejection emitted successfully",
            { context: { recipientId: newNotification.recipientId } }
        );

        return newNotification;
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
        const newNotification = await sequelize.transaction(async (t) => {
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

            const notificationData = {
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
            };

            const createdNotification = await Notification.create(
                notificationData,
                { transaction: t }
            );
            logger.info(
                "Notification record for event approval created successfully"
            );

            return createdNotification;
        });
        logger.info("Database transaction committed successfully");

        const io = socketService.getIO();
        io.to(newNotification.recipientId).emit("new_notification", {
            type: "event_approved",
            title: "Your Request has been APPROVED",
            message: `Congratulations! Your event "${newNotification.payload.eventName}" has been approved.`,
            data: newNotification,
        });

        logger.info(
            "Socket notification for event approval emitted successfully",
            { context: { recipientId: newNotification.recipientId } }
        );

        return newNotification;
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
