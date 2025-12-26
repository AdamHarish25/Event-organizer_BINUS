import multer from "multer";

const fileFilter = (req, file, cb) => {
    cb(null, true);
};

const uploadPoster = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
    },
});

export default uploadPoster;
