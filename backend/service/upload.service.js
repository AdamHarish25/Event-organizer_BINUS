import cloudinary from "../config/cloudinary.js";

export const uploadPosterImage = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: "image",
            timeout: 60000,
            ...options,
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

export const deleteImage = async (folderPath) => {
    try {
        await cloudinary.api.delete_resources_by_prefix(folderPath);
        await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw error;
    }
};
