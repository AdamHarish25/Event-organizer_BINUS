export const generateEventAssetPaths = (eventName, dateString) => {
    const assetCategory = "Desain-Publikasi";
    const now = new Date(dateString);
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

    return {
        mainEventFolderPath,
        fullFolderPath: `${mainEventFolderPath}/${assetCategory}`,
        fileName: `${sanitizedEventName}-${Date.now()}`,
    };
};
