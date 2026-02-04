import dotenv from "dotenv";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../config/r2.js";

dotenv.config({ path: "../.env" });

export const uploadToR2 = async (fileBuffer, key, mimeType) => {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await r2Client.send(command);

    return {
        key: key,
        url: `${process.env.R2_PUBLIC_DOMAIN}/${key}`,
    };
};

export const deleteFromR2 = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
};
