import AppError from "../utils/AppError.js";
import { generateEventAssetPaths } from "../utils/pathHelper.js";
import { uploadPosterImage, deleteImage } from "./upload.service.js";
import db from "../model/index.js";
import { sequelize } from "../config/dbconfig.js";
import socketService from "../socket/index.js";

export const saveNewEventAndNotify = async (userId, data, file, model) => {
    const { UserModel, EventModel, NotificationModel } = model;
    const { eventName, date, time, location, speaker } = data;
    const { mainEventFolderPath, fullFolderPath, fileName } =
        generateEventAssetPaths(eventName, date);

    const uploadOptions = {
        folder: fullFolderPath,
        public_id: fileName,
    };

    let uploadResult;
    try {
        const io = socketService.getIO();

        console.log(`Uploading to folder: ${fullFolderPath}`);
        uploadResult = await uploadPosterImage(file.buffer, uploadOptions);

        const newEvent = await sequelize.transaction(async (t) => {
            const event = await EventModel.create(
                {
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

export const handleDeleteEvent = async (eventId, model) => {
    const { EventModel } = model;
    const t = await db.sequelize.transaction();

    try {
        const data = await EventModel.findOne({
            where: { id: eventId },
            attributes: ["id", "imagePublicId"],
            transaction: t,
            lock: true,
        });

        if (!data) {
            await t.rollback();
            throw new AppError("Data event tidak ditemukan", 404, "NOT_FOUND");
        }

        if (data.imagePublicId) {
            const parts = data.imagePublicId.split("/");
            const imageFolderPath = parts.slice(0, 3).join("/");
            await deleteImage(imageFolderPath);
        }

        await EventModel.destroy({
            where: { id: data.id },
            transaction: t,
        });

        await t.commit();
        return true;
    } catch (error) {
        console.error("Gagal menghapus data, data akan di-rollback...");
        if (!t.finished) {
            await t.rollback();
        }
        throw error;
    }
};
