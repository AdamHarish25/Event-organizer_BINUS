import { uuidv7 } from "uuidv7";
import AppError from "../../utils/AppError.js";
import {
    generateEventAssetPaths,
    getFolderPathFromPublicId,
} from "../../utils/pathHelper.js";
import {
    uploadPosterImage,
    deleteSingleFile,
    deleteEventFolder,
} from "./../upload.service.js";
import { sequelize } from "../../config/dbconfig.js";
import socketService from "../../socket/index.js";
import { Event, User, Notification } from "../../model/index.js";

export const createEventService = async (userId, data, file, logger) => {
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

export const deleteEventService = async (adminId, eventId, logger) => {
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

export const updateEventService = async (
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
