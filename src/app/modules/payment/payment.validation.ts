import { z } from 'zod';

const createEventJoin = z.object({
    body: z.object({
        eventId: z.string({
            error: "join Event Id is required!"
        }),
    })
});

export const EventJoinValidation = {
    createEventJoin
};