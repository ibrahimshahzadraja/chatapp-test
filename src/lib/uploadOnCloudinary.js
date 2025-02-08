import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadOnCloudinary(file){
    try {
        const base64File = Buffer.from(await file.arrayBuffer()).toString('base64');

        if(!base64File) {
            return null;
        }

        const uploadedFile = await cloudinary.uploader.upload(`data:${file.type};base64,${base64File}`, {resource_type: 'auto'});

        if(!uploadedFile) {
            return null;
        }

        return uploadedFile.secure_url;

    } catch (error) {
        console.log("Error uploading file on cloudinary", error);
        return null;
    }
}