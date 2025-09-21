export const generateEventAssetPaths = (eventId) => {
    const assetCategory = "desain-publikasi";
    const mainEventFolderPath = `events/${eventId}`;

    return {
        fullFolderPath: `${mainEventFolderPath}/${assetCategory}`,
        fileName: `${Date.now()}`,
    };
};

export const getFolderPathFromPublicId = (publicId, logger) => {
    if (!publicId || typeof publicId !== "string") {
        logger.warn("Invalid publicId provided: not a non-empty string", {
            context: {
                providedId: publicId,
                type: typeof publicId,
            },
        });
        return null;
    }

    const parts = publicId.split("/");
    const folderParts = parts.slice(0, -2);

    if (folderParts.length === 0) {
        logger.warn("Invalid publicId provided: unexpected format", {
            context: {
                providedId: publicId,
                reason: "Cannot determine a folder path from the given ID.",
            },
        });
        return null;
    }

    return folderParts.join("/");
};
