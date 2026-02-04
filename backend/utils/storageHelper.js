import path from "path";
import crypto from "crypto";

export const generateEventAssetPaths = (
    eventId,
    originalFileName,
    eventDate,
    category = "poster",
) => {
    const ext = path.extname(originalFileName);
    const dateObj = new Date(eventDate);

    const year = dateObj.getFullYear();

    const month = String(dateObj.getMonth() + 1).padStart(2, "0");

    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString("hex");
    const uniqueFileName = `${timestamp}-${randomString}${ext}`;

    const folderPath = `${year}/${month}/${eventId}/${category}`;

    return {
        key: `${folderPath}/${uniqueFileName}`,
        folderPath: folderPath,
    };
};
