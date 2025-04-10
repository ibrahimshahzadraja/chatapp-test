import {z} from 'zod';

export const signinSchema = z.object({
    email: z.string().email({message: 'Invalid email address.'}),
    password: z.string().min(8, {message: 'Password must be at least 8 characters long.'}).max(20, {message: 'Password must be at most 20 characters long.'}),
})