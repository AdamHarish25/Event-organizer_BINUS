import AppError from "../utils/AppError.js";
import { uploadPosterImage, deleteImage } from "./upload.service.js";
import db from "../model/index.js";

export const saveNewEvent = async (userId, data, file, model) => {
    const { EventModel } = model;
    const { eventName, date, time, location, speaker, status } = data;

    const assetCategory = "Desain-Publikasi";
    const now = new Date(date);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];
    const monthName = monthNames[now.getMonth()];

    const sanitizedEventName = eventName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const eventFolder = `${year}-${month}-${day}-${sanitizedEventName}`;
    const mainEventFolderPath = `${year}/${monthName}/${eventFolder}`;
    const fullFolderPath = `${year}/${monthName}/${eventFolder}/${assetCategory}`;
    const fileName = `${sanitizedEventName}-${Date.now()}`;

    const uploadOptions = {
        folder: fullFolderPath,
        public_id: fileName,
    };

    let uploadResult;
    try {
        console.log(`Uploading to folder: ${fullFolderPath}`);
        uploadResult = await uploadPosterImage(file.buffer, uploadOptions);

        const imagePublicId = uploadResult.public_id;
        const imageUrl = uploadResult.secure_url;

        await EventModel.create({
            creatorId: userId,
            eventName,
            date,
            time,
            location,
            speaker,
            status,
            imageUrl,
            imagePublicId,
            imageFolderPath: mainEventFolderPath,
        });
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
