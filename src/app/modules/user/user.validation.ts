import { UserStatus } from "@prisma/client";
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

const createAdmin = z.object({
    password: z.string({
        error: "Password is required"
    }),
    admin: z.object({
        name: z.string({
            error: "Name is required!"
        }),
        email: z.string({
            error: "Email is required!"
        }),
        contactNumber: z.string({
            error: "Contact Number is required!"
        }).optional()
    })
});

const updateStatus = z.object({
    body: z.object({
        status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.DELETED])
    })
})

export const UserValidation = {
    createUserValidation,
    createAdmin,
    updateStatus
}