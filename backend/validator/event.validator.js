import Joi from "joi";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const baseEventSchema = Joi.object({
    eventName: Joi.string().trim().min(3).max(70).messages({
        "string.base": "Nama event harus berupa teks.",
        "string.empty": "Nama event tidak boleh kosong.",
        "string.min": "Nama event minimal 3 karakter.",
        "string.max": "Nama event maksimal 70 karakter.",
        "any.required": "Nama event wajib diisi.",
    }),

    time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
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

    location: Joi.string().trim().min(5).max(100).messages({
        "string.base": "Lokasi event harus berupa teks.",
        "string.empty": "Lokasi event tidak boleh kosong.",
        "string.min": "Lokasi event minimal 5 karakter.",
        "string.max": "Lokasi event maksimal 100 karakter.",
        "any.required": "Lokasi event wajib diisi.",
    }),

    speaker: Joi.string().trim().min(3).max(100).messages({
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
        .messages({
            "any.required": "Gambar poster wajib diisi.",
        })
        .unknown(true),
});

export const createEventSchema = baseEventSchema.keys({
    eventName: baseEventSchema.extract("eventName").required(),
    time: baseEventSchema.extract("time").required(),
    date: baseEventSchema.extract("date").required(),
    location: baseEventSchema.extract("location").required(),
    speaker: baseEventSchema.extract("speaker").required(),
    image: baseEventSchema.extract("image").required(),
});

export const updateEventSchema = baseEventSchema;

const uuidV7Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const paramsSchema = Joi.object({
    id: Joi.string().pattern(uuidV7Regex).required().messages({
        "string.pattern.base": "Parameter 'id' tidak valid",
        "any.required": "Parameter 'id' wajib diisi",
    }),
});

export const feedbackSchema = Joi.object({
    feedback: Joi.string().trim().min(1).max(1000).required(),
});
