import {api} from "@/lib/api"; // your configured axios instance

export async function uploadToCloudinary(imageFile: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    // Must use a raw axios instance that allows multipart/form-data
    const response = await api.post(url, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.secure_url as string;
}
