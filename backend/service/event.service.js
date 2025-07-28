import { uuidv7 } from "uuidv7";
import AppError from "../utils/AppError.js";
import { generateEventAssetPaths } from "../utils/pathHelper.js";
import { uploadPosterImage, deleteImage } from "./upload.service.js";
import { sequelize } from "../config/dbconfig.js";
import socketService from "../socket/index.js";

export const saveNewEventAndNotify = async (userId, data, file, model) => {
    const { UserModel, EventModel, NotificationModel } = model;
    const { eventName, date, time, location, speaker } = data;
    const eventId = uuidv7();
    const { mainEventFolderPath, fullFolderPath, fileName } =
        generateEventAssetPaths(eventId);

    let uploadResult;
    try {
        console.log(`Uploading to folder: ${fullFolderPath}`);
        uploadResult = await uploadPosterImage(file.buffer, {
            folder: fullFolderPath,
            public_id: fileName,
        });

        const newEvent = await sequelize.transaction(async (t) => {
            const event = await EventModel.create(
                {
                    id: eventId,
                    creatorId: userId,
                    eventName,
                    date,
                    time,
                    location,
                    speaker,
                    status: "pending",
                    imageUrl: uploadResult.secure_url,
                    imagePublicId: uploadResult.public_id,
                    imageFolderPath: mainEventFolderPath,
                },
                { transaction: t }
            );

            const superAdmins = await UserModel.findAll({
                where: { role: "super_admin" },
                attributes: ["id"],
                transaction: t,
            });

            const notifications = superAdmins.map((admin) => ({
                eventId: event.id,
                senderId: userId,
                recipientId: admin.id,
                notificationType: "event_created",
                payload: {
                    eventName: event.eventName,
                    time: event.time,
                    date: event.date,
                    location: event.location,
                    speaker: event.speaker,
                    imageUrl: event.imageUrl,
                },
            }));

            await NotificationModel.bulkCreate(notifications, {
                transaction: t,
            });

            return event;
        });

        const io = socketService.getIO();
        io.to("super_admin-room").emit("notifySuperAdmin", {
            message: "Admin membuat event baru",
            data: newEvent,
        });

        return newEvent;
    } catch (error) {
        if (uploadResult) {
            console.log(
                `Database save failed. Deleting uploaded image: ${uploadResult.public_id}`
            );
            await deleteImage(uploadResult.public_id);
        }

        throw error;
    }
};

export const handleDeleteEvent = async (eventId, EventModel) => {
    try {
        const result = await sequelize.transaction(async (t) => {
            const event = await EventModel.findOne({
                where: { id: eventId },
                attributes: ["id", "imagePublicId"],
                transaction: t,
            });

            if (!event) {
                throw new AppError(
                    "Data event tidak ditemukan",
                    404,
                    "NOT_FOUND"
                );
            }

            if (event.imagePublicId) {
                const parts = event.imagePublicId.split("/");
                const imageFolderPath = parts.slice(0, 3).join("/");
                await deleteImage(imageFolderPath);
            }

            await EventModel.destroy({
                where: { id: event.id },
                transaction: t,
            });

            return true;
        });

        return result;
    } catch (error) {
        console.error("Gagal menghapus data:", error.message);
        throw error;
    }
};

export const sendFeedback = async (eventId, superAdminId, feedback, model) => {
    const { EventModel, NotificationModel } = model;
    try {
        const io = socketService.getIO();

        const feedbackResult = await sequelize.transaction(async (t) => {
            const event = await EventModel.findByPk(eventId, {
                transaction: t,
            });
            if (!event) {
                throw new AppError("Event tidak ditemukan", 404, "NOT_FOUND");
            }

            const savedNotification = await NotificationModel.create(
                {
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
                },
                { transaction: t }
            );

            await EventModel.update(
                {
                    status: "revised",
                },
                {
                    where: { id: eventId },
                    transaction: t,
                }
            );
            return savedNotification;
        });

        io.to(feedbackResult.recipientId).emit("eventRevised", {
            message: "Event anda direvisi oleh Super Admin",
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
        const { mainEventFolderPath, fullFolderPath, fileName } =
            generateEventAssetPaths(eventId);

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
                      imageFolderPath: mainEventFolderPath,
                  }
                : data;

            await event.update(
                {
                    ...dataToUpdate,
                    status: "revised",
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
                notificationType: "event_revised",
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
            await deleteImage(uploadResult.public_id);
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
) => {};
