import z from "zod";

const createUserValidation = z.object({
    password: z.string(),
    profile: z.object({
        email: z.email({
            error: "Email is required!"
        }),
        name: z.string({
            error: "Name is required!"
        }),
        location: z.string({
            error: "Address is required"
        }).optional()
    })
});

export const UserValidation = {
    createUserValidation,
}