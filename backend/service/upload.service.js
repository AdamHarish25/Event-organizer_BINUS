import cloudinary from "../config/cloudinary.js";

export const uploadPosterImage = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: "image",
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

export const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw error;
    }
};
