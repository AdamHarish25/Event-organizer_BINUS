import { uuidv7 } from "uuidv7";
import { startOfToday, isToday, isThisWeek } from "date-fns";
import { Op } from "sequelize";
import AppError from "../utils/AppError.js";
import { generateEventAssetPaths } from "../utils/pathHelper.js";
import {
    uploadPosterImage,
    deleteSingleFile,
    deleteEventFolder,
} from "./upload.service.js";
import { sequelize } from "../config/dbconfig.js";
import socketService from "../socket/index.js";

export const getCategorizedEventsService = async (EventModel) => {
    try {
        const allUpcomingEvents = await EventModel.findAll({
            where: {
                date: { [Op.gte]: startOfToday() },
                status: "approved",
            },
            order: [
                ["date", "ASC"],
                ["startTime", "ASC"],
            ],
            attributes: [
                "id",
                "eventName",
                "date",
                "startTime",
                "endTime",
                "location",
                "speaker",
                "imageUrl",
            ],
        });

        const categorizedEvents = {
            current: [],
            thisWeek: [],
            next: [],
        };

        for (const event of allUpcomingEvents) {
            const eventDate = new Date(event.date);

            if (isToday(eventDate)) {
                categorizedEvents.current.push(event);
            } else if (isThisWeek(eventDate, { weekStartsOn: 1 })) {
                categorizedEvents.thisWeek.push(event);
            } else {
                categorizedEvents.next.push(event);
            }
        }

        const finalResult = {
            current: categorizedEvents.current,
            thisWeek: categorizedEvents.thisWeek,
            next: categorizedEvents.next,
        };

        return finalResult;
    } catch (error) {
        console.error("Gagal mengambil data event terkategori:", error);
        throw error;
    }
};

export const saveNewEventAndNotify = async (userId, data, file, model) => {
    const { UserModel, EventModel, NotificationModel } = model;
    const { eventName, date, startTime, endTime, location, speaker } = data;
    const eventId = uuidv7();
    const { fullFolderPath, fileName } = generateEventAssetPaths(eventId);

    let uploadResult;
    try {
        console.log(`Creating event: ${eventName} for user: ${userId}`);
        console.log(`Uploading to folder: ${fullFolderPath}`);

        uploadResult = await uploadPosterImage(file.buffer, {
            folder: fullFolderPath,
            public_id: fileName,
        });

        console.log(`Upload successful: ${uploadResult.secure_url}`);

        let creatorName;
        const newEvent = await sequelize.transaction(async (t) => {
            const [creator, superAdmins] = await Promise.all([
                UserModel.findByPk(userId, {
                    attributes: ["firstName"],
                    transaction: t,
                }),
                UserModel.findAll({
                    where: { role: "super_admin" },
                    attributes: ["id"],
                    transaction: t,
                }),
            ]);

            if (!creator) {
                throw new AppError(
                    "User tidak ditemukan",
                    404,
                    "USER_NOT_FOUND"
                );
            }

            creatorName = creator.firstName;

            const event = await EventModel.create(
                {
                    id: eventId,
                    creatorId: userId,
                    eventName,
                    date,
                    startTime,
                    endTime,
                    location,
                    speaker,
                    status: "pending",
                    imageUrl: uploadResult.secure_url,
                    imagePublicId: uploadResult.public_id,
                },
                { transaction: t }
            );

            const notificationForSuperAdmin = superAdmins.map((supAdmin) => ({
                eventId: event.id,
                senderId: userId,
                recipientId: supAdmin.id,
                notificationType: "event_created",
                payload: {
                    eventName: event.eventName,
                    startTime: event.startTime,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
            }));

            const notificationForCreator = {
                eventId: event.id,
                senderId: userId,
                recipientId: userId,
                notificationType: "event_pending",
                payload: {
                    eventName: event.eventName,
                    startTime: event.startTime,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
            };

            const allNotification = [
                ...notificationForSuperAdmin,
                notificationForCreator,
            ];

            await NotificationModel.bulkCreate(allNotification, {
                transaction: t,
            });

            return event;
        });

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

        console.log(`Upload successful: ${uploadResult.secure_url}`);
        return newEvent;
    } catch (error) {
        console.error("Event creation failed:", {
            userId,
            eventName,
            error: error.message,
            uploadResult: uploadResult?.public_id || "none",
        });

        if (uploadResult) {
            console.log(
                `Database save failed. Deleting uploaded image: ${uploadResult.public_id}`
            );
            await deleteSingleFile(uploadResult.public_id);
        }

        throw error;
    }
};

export const handleDeleteEvent = async (adminId, eventId, model) => {
    const { UserModel, EventModel, NotificationModel } = model;

    let eventDataForCleanupAndNotify;
    let adminName;
    try {
        await sequelize.transaction(async (t) => {
            const event = await EventModel.findOne({
                where: { id: eventId, creatorId: adminId },
                include: [
                    {
                        model: UserModel,
                        as: "creator",
                        attributes: ["firstName"],
                    },
                ],
                transaction: t,
            });

            if (!event) {
                throw new AppError(
                    "Event tidak ditemukan atau Anda tidak berhak mengubahnya.",
                    404,
                    "NOT_FOUND"
                );
            }

            const superAdmins = await UserModel.findAll({
                where: { role: "super_admin" },
                attributes: ["id"],
                transaction: t,
            });

            eventDataForCleanupAndNotify = event.toJSON();
            adminName = event.creator.firstName;

            await event.destroy({ transaction: t });

            const notifications = superAdmins.map((superAdmin) => ({
                eventId: eventDataForCleanupAndNotify.id,
                senderId: adminId,
                recipientId: superAdmin.id,
                notificationType: "event_deleted",
                payload: {
                    eventName: eventDataForCleanupAndNotify.eventName,
                    time: eventDataForCleanupAndNotify.time,
                    date: eventDataForCleanupAndNotify.date,
                    location: eventDataForCleanupAndNotify.location,
                    speaker: eventDataForCleanupAndNotify.speaker,
                    imageUrl: eventDataForCleanupAndNotify.imageUrl,
                },
            }));

            await NotificationModel.bulkCreate(notifications, {
                transaction: t,
            });
        });

        if (eventDataForCleanupAndNotify?.imagePublicId) {
            try {
                const publicId = eventDataForCleanupAndNotify.imagePublicId;

                if (!publicId || typeof publicId !== "string") {
                    console.warn("Invalid publicId format:", publicId);
                    return true;
                }

                const parts = publicId.split("/");
                if (parts.length < 2) {
                    console.warn("PublicId format tidak sesuai:", publicId);
                    return true;
                }

                parts.pop();
                const folderPath = parts.join("/");

                if (folderPath) {
                    await deleteEventFolder(folderPath);
                    console.log(
                        `Cloud folder deleted successfully: ${folderPath}`
                    );
                }
            } catch (cloudError) {
                console.error("Cloud deletion failed:", {
                    eventId: eventDataForCleanupAndNotify.id,
                    publicId: eventDataForCleanupAndNotify.imagePublicId,
                    error: cloudError.message,
                });
            }
        }

        if (eventDataForCleanupAndNotify) {
            const io = socketService.getIO();
            io.to("super_admin-room").emit("new_notification", {
                type: "event_deleted",
                title: `Event "${eventDataForCleanupAndNotify.eventName}" has been deleted.`,
                message: `${adminName} removed this event from the system. No further action is required`,
                data: eventDataForCleanupAndNotify,
            });
        }

        return true;
    } catch (dbError) {
        console.error("Gagal menghapus data dari database:", dbError.message);
        throw dbError;
    }
};

export const sendFeedback = async (eventId, superAdminId, feedback, model) => {
    const { EventModel, NotificationModel } = model;
    try {
        const feedbackResult = await sequelize.transaction(async (t) => {
            const event = await EventModel.findByPk(eventId, {
                transaction: t,
            });
            if (!event) {
                throw new AppError("Event tidak ditemukan", 404, "NOT_FOUND");
            }

            await event.update({ status: "revised" }, { transaction: t });

            const notifications = {
                eventId,
                senderId: superAdminId,
                recipientId: event.creatorId,
                notificationType: "event_revised",
                feedback,
                payload: {
                    eventName: event.eventName,
                    time: event.time,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
            };

            const newNotification = await NotificationModel.create(
                notifications,
                { transaction: t }
            );

            return newNotification;
        });

        const io = socketService.getIO();
        io.to(feedbackResult.recipientId).emit("new_notification", {
            type: "event_revised",
            title: "Your Request requires REVISION",
            message: "Please review the provided Feedback",
            data: feedbackResult,
        });

        return feedbackResult;
    } catch (error) {
        console.error("Gagal mengirim feedback:", error.message);
        throw error;
    }
};

export const editEventService = async (
    eventId,
    adminId,
    data,
    image,
    model
) => {
    const { UserModel, EventModel, NotificationModel } = model;

    let uploadResult;
    try {
        const { fullFolderPath, fileName } = generateEventAssetPaths(eventId);

        if (image) {
            console.log(`Uploading to folder: ${fullFolderPath}`);
            uploadResult = await uploadPosterImage(image.buffer, {
                folder: fullFolderPath,
                public_id: fileName,
            });
        }

        const updatedEvent = await sequelize.transaction(async (t) => {
            const event = await EventModel.findOne({
                where: { id: eventId, creatorId: adminId },
                transaction: t,
            });

            if (!event) {
                throw new AppError(
                    "Event tidak ditemukan atau Anda tidak berhak mengubahnya.",
                    404,
                    "NOT_FOUND"
                );
            }

            const dataToUpdate = image
                ? {
                      ...data,
                      imageUrl: uploadResult.secure_url,
                      imagePublicId: uploadResult.public_id,
                  }
                : data;

            await event.update(
                {
                    ...dataToUpdate,
                    status: "pending",
                },
                { transaction: t }
            );

            const superAdmins = await UserModel.findAll({
                where: { role: "super_admin" },
                attributes: ["id"],
                transaction: t,
            });

            console.log("Data yang mau diupdate adalah ", dataToUpdate);

            const updatedPayloadData = { ...event.dataValues, ...dataToUpdate };
            const notifications = superAdmins.map((superAdmin) => ({
                eventId: event.id,
                senderId: adminId,
                recipientId: superAdmin.id,
                notificationType: "event_updated",
                payload: {
                    eventName: updatedPayloadData.eventName,
                    time: updatedPayloadData.time,
                    date: updatedPayloadData.date,
                    location: updatedPayloadData.location,
                    speaker: updatedPayloadData.speaker,
                    imageUrl: updatedPayloadData.imageUrl,
                },
            }));

            await NotificationModel.bulkCreate(notifications, {
                transaction: t,
            });

            return event;
        });

        const io = socketService.getIO();
        io.to("super_admin-room").emit("eventUpdated", {
            message: `Event "${updatedEvent.eventName}" telah diperbarui dan menunggu persetujuan.`,
            data: updatedEvent,
        });

        return updatedEvent;
    } catch (error) {
        if (uploadResult) {
            console.log(
                `Database transaction failed. Deleting uploaded image: ${uploadResult.public_id}`
            );
            await deleteSingleFile(uploadResult.public_id);
        }

        console.error("Gagal mengedit event:", error.message);
        throw error;
    }
};

export const rejectEventService = async (
    eventId,
    superAdminId,
    feedback,
    model
) => {
    const { EventModel, NotificationModel } = model;

    try {
        const rejectEventResult = await sequelize.transaction(async (t) => {
            const event = await EventModel.findOne({
                where: { id: eventId, status: ["pending", "revised"] },
                transaction: t,
            });

            if (!event) {
                throw new AppError(
                    "Data event tidak ditemukan",
                    404,
                    "NOT_FOUND"
                );
            }

            await event.update({ status: "rejected" }, { transaction: t });

            const notifications = {
                eventId: event.id,
                senderId: superAdminId,
                recipientId: event.creatorId,
                notificationType: "event_rejected",
                feedback,
                payload: {
                    eventName: event.eventName,
                    time: event.time,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
            };

            const newNotification = await NotificationModel.create(
                notifications,
                { transaction: t }
            );

            return newNotification;
        });

        const io = socketService.getIO();
        io.to(rejectEventResult.recipientId).emit("new_notification", {
            type: "event_rejected",
            title: "Your Request has been REJECTED",
            message: `Please review the provided Feedback.`,
            data: rejectEventResult,
        });

        return rejectEventResult;
    } catch (error) {
        console.error("Gagal reject event.", error);
        throw error;
    }
};

export const approveEventService = async (eventId, superAdminId, model) => {
    const { EventModel, NotificationModel } = model;

    try {
        const approveEventResult = await sequelize.transaction(async (t) => {
            const event = await EventModel.findOne({
                where: { id: eventId, status: ["pending", "revised"] },
                transaction: t,
            });

            if (!event) {
                throw new AppError(
                    "Data event tidak ditemukan atau sudah diproses",
                    404,
                    "NOT_FOUND"
                );
            }

            await event.update(
                {
                    status: "approved",
                },
                { transaction: t }
            );

            const notifications = {
                eventId: event.id,
                senderId: superAdminId,
                recipientId: event.creatorId,
                notificationType: "event_approved",
                payload: {
                    eventName: event.eventName,
                    time: event.time,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
            };

            const newNotification = await NotificationModel.create(
                notifications,
                {
                    transaction: t,
                }
            );

            return newNotification;
        });

        const io = socketService.getIO();
        io.to(approveEventResult.recipientId).emit("new_notification", {
            type: "event_approved",
            title: "Your Request has been APPROVED",
            message: `Congratulations! Your event "${approveEventResult.payload.eventName}" has been approved.`,
            data: approveEventResult,
        });

        return approveEventResult;
    } catch (error) {
        console.error("Gagal approve event.", error);
        throw error;
    }
};
