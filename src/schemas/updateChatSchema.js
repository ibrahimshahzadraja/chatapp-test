import {z} from 'zod';

export const updateChatSchema = z.object({
    convoname: z.string().optional(),
    password: z.string().optional(),
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
        .optional(),
    chatname: z.string().nonempty({message: 'Chat name is required'})
});