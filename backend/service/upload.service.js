import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";

export const uploadPosterImage = (buffer, options, logger) => {
    return new Promise((resolve, reject) => {
        try {
            logger.info("Attempting to upload file to cloud storage", {
                context: {
                    folder: options.folder,
                    public_id: options.public_id,
                },
            });

            const uploadOptions = {
                resource_type: "image",
                timeout: 60000,
                ...options,
            };

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        logger.error("Failed to upload file to cloud storage", {
                            context: { folder: options.folder },
                            error: { message: error.message, name: error.name },
                        });
                        return reject(error);
                    }

                    logger.info("File uploaded successfully to cloud storage", {
                        context: {
                            publicId: result.public_id,
                            url: result.secure_url,
                        },
                    });
                    resolve(result);
                },
            );
            uploadStream.end(buffer);
        } catch (setupError) {
            logger.error(
                "An unexpected error occurred before starting the upload stream",
                {
                    error: {
                        message: setupError.message,
                        stack: setupError.stack,
                    },
                },
            );
            reject(setupError);
        }
    });
};

export const deleteEventFolder = async (folderPath, logger) => {
    try {
        logger.info("Attempting to delete cloud folder and its resources", {
            context: { folderPath },
        });

        await cloudinary.api.delete_resources_by_prefix(folderPath);
        logger.info("All resources within the folder deleted", {
            context: { folderPath },
        });

        await cloudinary.api.delete_folder(folderPath);
        logger.info("Cloud folder deleted successfully", {
            context: { folderPath },
        });
    } catch (error) {
        logger.error("Failed to delete cloud folder", {
            context: { folderPath },
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });
        throw new AppError(
            "Gagal menghapus folder di cloud.",
            500,
            "CLOUD_DELETE_ERROR",
        );
    }
};

export const deleteSingleFile = async (imagePublicId, logger) => {
    try {
        logger.info("Attempting to delete single file from cloud storage", {
            context: { publicId: imagePublicId },
        });

        const result = await cloudinary.uploader.destroy(imagePublicId);

        logger.info("Single file deleted successfully from cloud storage", {
            context: { publicId: imagePublicId, result },
        });

        return result;
    } catch (error) {
        logger.error("Failed to delete single file from cloud storage", {
            context: { publicId: imagePublicId },
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });
        throw new AppError(
            "Gagal menghapus file di cloud.",
            500,
            "CLOUD_DELETE_ERROR",
        );
    }
};
