
import { z } from "zod";

const UpdateProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
        location: z.string().optional(),
        interests: z.array(z.string()).default([]),
    })

});

export const ProfileValidation = {
    UpdateProfileSchema
}