import z from "zod";

const create = z.object({
    body: z.object({
        joinEventId: z.string({
            error: 'join Event Id is required',
        }),
        rating: z.number({
            error: 'Rating is required',
        }),
        comment: z.string({
            error: 'Comment is required',
        })
    }),
});

export const ReviewValidation = {
    create,
};