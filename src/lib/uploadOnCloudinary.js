import { v2 as cloudinary } from "cloudinary";
import { Buffer } from 'buffer';
import path from 'path';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadOnCloudinary(file, type) {
    try {
        if (!file) {
            return null;
        }

        const extension = path.extname(file.name);
        const originalFilename = file.name || "file";
        const timestamp = Date.now();
        const uniqueFilename = `${originalFilename.split(".")[0]}_${timestamp}${extension}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

        const resourceType = type === "file" ? "raw" : "auto";

        const uploadedFile = await cloudinary.uploader.upload(base64File, {
            resource_type: resourceType,
            public_id: `uploads/${uniqueFilename}`,
        });

        if (!uploadedFile) {
            return null;
        }

        return uploadedFile.secure_url;

    } catch (error) {
        console.log("Error uploading file on cloudinary", error);
        return null;
    }
}
