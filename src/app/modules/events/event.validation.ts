

import z from "zod";

const createEventValidation = z.object({
    EventName: z.string({ error: "EventName is required" }),
    description: z.string().optional(),
    image: z.string().optional(),
     date: z.string({ message: "Date is required" }).refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date format, must be ISO string" }
  ),
    category: z.string().optional(),
    location: z.string({ error: "Location is required" }),
    minParticipants: z.number({error: "minParticipants must be at least 1 and Number"}),
    maxParticipants: z.number({error: "maxParticipantsmust be at least 1 and Number"}),
    fee: z.number({error: "fee must be Number "}).default(0),

});

const updateEventValidation = z.object({
    EventName: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date",
      }).optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    minParticipants: z.number().min(1).optional(),
    maxParticipants: z.number().min(1).optional(),
    fee: z.number().min(0).optional(),
    status: z.enum(["OPEN", "FULL", "CANCELLED", "COMPLETED"]).optional(),
  
});



export const EventValidation = {
    createEventValidation,
    updateEventValidation
}