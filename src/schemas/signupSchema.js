import {z} from 'zod';

export const signUpSchema = z.object({
    username: z.string().min(6, {message: 'Username must be at least 6 characters long.'}).max(20, {message: 'Username must be at most 20 characters long.'}),
    email: z.string().email({message: 'Invalid email address.'}),
    password: z.string().min(8, {message: 'Password must be at least 8 characters long.'}).max(20, {message: 'Password must be at most 20 characters long.'}),
    profilePicture: z.custom((value) => value instanceof File || value === null)
        .refine((value) => value !== null && value.size > 0, {
            message: 'Profile Picture is missing'
        })
        .refine((file) => file.size <= 3 * 1024 * 1024, {
            message: 'File size must be less than 3MB'
        })
        .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
            message: 'Invalid file type. Only JPEG and PNG are allowed'
        })
});