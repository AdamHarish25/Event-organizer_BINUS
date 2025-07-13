import { uploadPosterImage, deleteImage } from "./upload.service.js";

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
