import {z} from 'zod';

export const createChatSchema = z.object({
    chatname: z.string().min(6, {message: 'Chatname must be at least 6 characters long.'}).max(20, {message: 'Chatname must be at most 20 characters long.'}),
    password: z.string().min(8, {message: 'Password must be at least 8 characters long.'}).max(20, {message: 'Password must be at most 20 characters long.'}),
    profilePicture: z.custom((value) => value instanceof File)
        .refine(
            (file) => file.size === 0 || (
                file.size <= 3 * 1024 * 1024 &&
                ['image/jpeg', 'image/png'].includes(file.type)
            ),
            (file) => ({
                message: file.size > 3 * 1024 * 1024 
                    ? 'File size must be less than 3MB'
                    : 'Invalid file type. Only JPEG and PNG are allowed'
            })
        )
        .optional()
});