import Joi from "joi";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

// const eventSchema = Joi.object({
//     eventName: Joi.string().trim().min(3).max(255).required().messages({
//         "string.base": "Nama event harus berupa teks.",
//         "string.empty": "Nama event tidak boleh kosong.",
//         "string.min": "Nama event minimal 3 karakter.",
//         "string.max": "Nama event maksimal 255 karakter.",
//         "any.required": "Nama event wajib diisi.",
//     }),

//     time: Joi.string()
//         .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
//         .required()
//         .messages({
//             "string.base": "Waktu event harus berupa teks.",
//             "string.empty": "Waktu event tidak boleh kosong.",
//             "string.pattern.base":
//                 "Format waktu tidak valid. Gunakan format HH:MM (misal: 14:30).",
//             "any.required": "Waktu event wajib diisi.",
//         }),

//     date: Joi.string()
//         .pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/)
//         .required()
//         .custom((value, helpers) => {
//             const [day, month, year] = value.split("/").map(Number);
//             const parsedDate = new Date(`${year}-${month}-${day}`);

//             const isValidDate =
//                 !isNaN(parsedDate.getTime()) &&
//                 parsedDate.getDate() === day &&
//                 parsedDate.getMonth() + 1 === month &&
//                 parsedDate.getFullYear() === year;

//             if (!isValidDate) {
//                 return helpers.error("date.invalid");
//             }

//             const today = new Date();
//             today.setHours(0, 0, 0, 0);

//             if (parsedDate < today) {
//                 return helpers.error("date.past");
//             }

//             if (parsedDate.getTime() === today.getTime()) {
//                 const timeValue = helpers.state.ancestors[0].time;
//                 if (timeValue) {
//                     const [hours, minutes] = timeValue.split(":").map(Number);
//                     const currentTime = new Date();
//                     const eventDateTime = new Date(parsedDate);
//                     eventDateTime.setHours(hours, minutes, 0, 0);

//                     if (eventDateTime <= currentTime) {
//                         return helpers.error("datetime.past");
//                     }
//                 }
//             }

//             return value;
//         }, "Validasi tanggal")
//         .messages({
//             "string.pattern.base": "Format tanggal harus DD/MM/YYYY",
//             "date.invalid": "Tanggal tidak valid secara kalender",
//             "date.past": "Tanggal tidak boleh di masa lalu",
//             "datetime.past": "Tanggal dan waktu tidak boleh di masa lalu",
//             "any.required": "Tanggal wajib diisi",
//         }),

//     location: Joi.string().trim().min(5).max(255).required().messages({
//         "string.base": "Lokasi event harus berupa teks.",
//         "string.empty": "Lokasi event tidak boleh kosong.",
//         "string.min": "Lokasi event minimal 5 karakter.",
//         "string.max": "Lokasi event maksimal 255 karakter.",
//         "any.required": "Lokasi event wajib diisi.",
//     }),

//     speaker: Joi.alternatives()
//         .try(
//             Joi.string().trim().min(3).max(100),
//             Joi.array().items(Joi.string().trim().min(3).max(100))
//         )
//         .required()
//         .messages({
//             "alternatives.types":
//                 "Nama speaker harus berupa teks atau array teks.",
//             "string.base": "Nama speaker harus berupa teks.",
//             "string.empty": "Nama speaker tidak boleh kosong.",
//             "string.min": "Nama speaker minimal 3 karakter.",
//             "string.max": "Nama speaker maksimal 100 karakter.",
//             "array.base": "Speaker harus berupa daftar nama.",
//             "array.includesRequiredKnowns":
//                 "Setiap nama speaker harus berupa teks.",
//             "any.required": "Nama speaker wajib diisi.",
//         }),

//     status: Joi.string()
//         .valid("accept", "pending", "rejected")
//         .default("pending")
//         .messages({
//             "string.base": "Status event harus berupa teks.",
//             "string.empty": "Status event tidak boleh kosong.",
//             "any.only":
//                 'Status event tidak valid. Hanya boleh "accept", "pending", atau "rejected".',
//         }),
// });

// export default eventSchema;

const eventSchema = Joi.object({
    eventName: Joi.string().trim().min(3).max(70).required().messages({
        "string.base": "Nama event harus berupa teks.",
        "string.empty": "Nama event tidak boleh kosong.",
        "string.min": "Nama event minimal 3 karakter.",
        "string.max": "Nama event maksimal 70 karakter.",
        "any.required": "Nama event wajib diisi.",
    }),

    time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
            "string.base": "Waktu event harus berupa teks.",
            "string.empty": "Waktu event tidak boleh kosong.",
            "string.pattern.base":
                "Format waktu tidak valid. Gunakan format HH:MM (misal: 14:30).",
            "any.required": "Waktu event wajib diisi.",
        }),

    // Di masa depan, mungkin ini akan menyebabkan error, nanti gati pake .iso()
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}\.\d{3}Z)?$/)
        .required()
        .custom((value, helpers) => {
            const timeValue = helpers?.state?.ancestors?.[0]?.time;

            if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) {
                return value;
            }

            const [hours, minutes] = timeValue.split(":").map(Number);
            const eventDateTime = new Date(value);
            eventDateTime.setHours(hours, minutes, 0, 0);

            if (isNaN(eventDateTime.getTime())) {
                return helpers.error("datetime.invalid");
            }

            const now = new Date();
            if (eventDateTime <= now) {
                return helpers.error("datetime.past");
            }

            return value;
        })
        .messages({
            "date.base": "Tanggal event harus berupa tanggal.",
            "date.format": "Format tanggal harus ISO (YYYY-MM-DD).",
            "datetime.past": "Tanggal dan waktu tidak boleh di masa lalu.",
            "any.required": "Tanggal wajib diisi.",
        }),

    location: Joi.string().trim().min(5).max(100).required().messages({
        "string.base": "Lokasi event harus berupa teks.",
        "string.empty": "Lokasi event tidak boleh kosong.",
        "string.min": "Lokasi event minimal 5 karakter.",
        "string.max": "Lokasi event maksimal 100 karakter.",
        "any.required": "Lokasi event wajib diisi.",
    }),

    speaker: Joi.string().trim().min(3).max(100).required().messages({
        "string.base": "Nama speaker harus berupa teks.",
        "string.empty": "Nama speaker tidak boleh kosong.",
        "string.min": "Nama speaker minimal 3 karakter.",
        "string.max": "Nama speaker maksimal 100 karakter.",
        "any.required": "Nama speaker wajib diisi.",
    }),

    image: Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string()
            .valid("image/jpeg", "image/png", "image/gif")
            .required()
            .messages({
                "any.only": "Tipe file harus JPEG, PNG, atau WebP",
            }),
        size: Joi.number()
            .max(10 * 1024 * 1024)
            .required()
            .messages({
                "number.max": "Ukuran gambar tidak boleh melebihi 10MB.",
            }),
        buffer: Joi.binary().required(),
    })
        .required()
        .messages({
            "any.required": "Gambar poster wajib diisi.",
        })
        .unknown(true),
});

export default eventSchema;
