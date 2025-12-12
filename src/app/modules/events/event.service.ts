
import { prisma } from "../../../config/prisma";
import { IAuthUser } from "../../type/role";
import { fileUploader } from "../../helper/fileUploader";
import { Request } from "express";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { Prisma, Role } from "@prisma/client";
import { EventSearchableFields } from "./event.constant";
import ApiError from "../../errors/ApiError";
import { stripe } from "../../helper/stripe";




const createEvent = async (user: IAuthUser, req: Request) => {
  // console.log("user", user)
  // console.log("data", req.body)

  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file)
    // console.log("upload file", uploadResult)
    req.body.image = uploadResult?.secure_url
  }
  // console.log("data", req.body)

  const userData = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email
    }
  })

  const eventDate = new Date(req.body.date);
  if (isNaN(eventDate.getTime())) {
    throw new Error("Invalid date format! Must be ISO string.");
  }

  const event = await prisma.event.create({
    data: {
      EventName: req.body.EventName,
      description: req.body.description,
      image: req.body.image,
      date: eventDate,
      location: req.body.location,
      minParticipants: req.body.minParticipants,
      maxParticipants: req.body.maxParticipants,
      fee: req.body.fee,
      category: req.body.category,
      hostId: userData.id
    }
  });

  return event;
}

// Get All Events (with filters)
const getAllEvents = async (params: any, options: IOptions) => {

  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options)
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.EventWhereInput[] = []

  if (searchTerm) {
    andConditions.push({
      OR: EventSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive"
        }
      }))
    })
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({
        [key]: {
          equals: (filterData as any)[key]
        }
      }))
    })
  }

  const whereConditions: Prisma.EventWhereInput = andConditions.length > 0 ? {
    AND: andConditions
  } : {}

  await prisma.event.findMany({

  });

  const result = await prisma.event.findMany({
    skip,
    take: limit,

    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder
    },
    include: {
      host:true,
      participants: true,
      reviews: {
        select: {
          rating: true
        }
      },
    }
  });

  const total = await prisma.event.count({
    where: whereConditions
  });
  return {
    meta: {
      page,
      limit,
      total
    },
    data: result
  };
}

const getMyEvents = async (
  filters: any,
  options: IOptions,
  user: IAuthUser
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const userData = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email
    }
  })

  const andConditions = [];

  andConditions.push({
    AND: [
      {
        hostId: userData.id
      }
    ]
  })


  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({
        [key]: {
          equals: (filterData as any)[key]
        }
      }))
    })
  }

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.event.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {

        }
  });
  const total = await prisma.event.count({
    where: whereConditions
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const updateEvent = async (id: string, req: Request, user: IAuthUser) => {
  const payload = req.body;

  // 1️⃣ Get logged-in user info
  // const userInfo = await prisma.user.findUniqueOrThrow({
  //   where: {
  //     email: user?.email,
  //   },
  // });

  // 2️⃣ Handle image upload if file exists
  const file = req.file;

  if (file) {
    const uploadedImage = await fileUploader.uploadToCloudinary(file);
    payload.image = uploadedImage?.secure_url; // event banner image
  }

  // 3️⃣ Check whether event exists
  const existingEvent = await prisma.event.findUnique({
    where: { id },
  });

  if (!existingEvent) {
    throw new ApiError(404, "Event not found");
  }

  // 4️⃣ Authorization: only Host or Admin can update
  // if (user?.role !== "ADMIN" && existingEvent.hostId !== userInfo.id) {
  //   throw new ApiError(403, "You are not allowed to update this event");
  // }

  // 5️⃣ Fix date field if exists in payload
  if (payload.date) {
    payload.date = new Date(payload.date);
  }

  // 6️⃣ Update event
  const updatedEvent = await prisma.event.update({
    where: { id },
    data: payload,
  });

  return updatedEvent;
};

const getEventById = async (id: string) => {
  // Find event by ID
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      host: true,
      participants: true,   // Fetch participants
      reviews: true,        // Fetch event reviews
      payment: {
        select: {
          id: true,
          userId: true,
          eventId: true,
          transactionId: true,
          amount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return event;
};

//   // Delete Event (Host only)
const deleteEvent = async (id: string, user: IAuthUser) => {

  const userInfo = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) throw new Error("Event not found");
  if (event.hostId !== userInfo.id)
    throw new Error("Unauthorized");

  await prisma.event.delete({ where: { id } });

  return { message: "Event deleted successfully" };
}

// users join Event

const joinEvent = async (eventId: string, user: IAuthUser) => {

  const userInfo = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });
  // 1. Find the event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: true },
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  // console.log("userInfo.id:", userInfo.id);
  // console.log("eventId:", event.id);
  // 2. Check if user already joined
  const alreadyJoined = event.participants.some(p => p.userId === userInfo.id);
  if (alreadyJoined) {
    throw new ApiError(400, "You have already joined this event");
  }

  // 3. Check if maxParticipants reached
  if (event.participants.length >= event.maxParticipants) {
    throw new ApiError(400, "Event is already full");
  }

  // 4. Create join event record
  const result = await prisma.$transaction(async (tnx) => {
    const participant = await tnx.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: userInfo.id,
      },
      include: {
        user: true,
        event: true,

      }

    });

    // 5. Update event status if maxParticipants reached
    const totalParticipants = event.participants.length + 1;
    if (totalParticipants >= event.maxParticipants) {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: "FULL" },
      });
    }

    const today = new Date();
    const transactionId = "Event-Activites-" + today.getFullYear() + "-" + today.getMonth() + "-" + today.getDay() + "-" + today.getHours() + "-" + today.getMinutes();

    const paymentData = await tnx.payment.create({
      data: {
        userId: userInfo.id,
        eventId: event.id,
        amount: event.fee,
        joinEventId: participant.id,
        transactionId
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user?.email,

      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Event with ${event.EventName}`,
            },
            unit_amount: event.fee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: event.id,
        joinEventId: participant.id,
        paymentId: paymentData.id,
      },
      success_url: `https://www.programming-hero.com/`,
      cancel_url: `https://next.programming-hero.com/`,
    });
    console.log("session", session)
    // return participant;
    return { paymentUrl: session.url };
  })

  return result
};

const leaveEvent = async (eventId: string, user: IAuthUser) => {

  const userInfo = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });
  // 1️⃣ Find the event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: true },
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // 2️⃣ Check if user is a participant
  const participant = event.participants.find(p => p.userId === userInfo.id);
  if (!participant) {
    throw new ApiError(400, "You are not a participant of this event");
  }

  // 3️⃣ Remove participant
  await prisma.eventParticipant.delete({
    where: { id: participant.id },
  });

  // 4️⃣ Update event status if previously FULL
  if (event.status === "FULL") {
    await prisma.event.update({
      where: { id: eventId },
      data: { status: "OPEN" },
    });
  }

  return { message: "Left event successfully" };
};

const getAllJoinedEvents = async (user: IAuthUser, filters: unknown, options: unknown) => {

  const userInfo = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  return prisma.eventParticipant.findMany({
    where: { userId: userInfo.id },
    include: {
      event: {
        include: {
          host: true,
          participants: true,
        },
      },
    },

  });

};

const getMyUserJoinEvent = async (userId: string) => {
  const result = await prisma.eventParticipant.findMany({
    where: {
      userId
    },
    include: {
      event: true,
      payment: {
        select: {
          id: true,
          userId: true,
          eventId: true,
          transactionId: true,
          amount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
  });

  const total = await prisma.eventParticipant.count({
    where: {
      userId
    },

  });
  return {
    meta: {
      total
    },
    data: result,
  };
};



// const getMyUserJoinEvent = async (user: IAuthUser, filters: any, options: IOptions) => {

//   const userInfo = await prisma.profile.findUniqueOrThrow({
//     where: {
//       email: user?.email,
//     },
//   });
//   const { limit, page, skip } = paginationHelper.calculatePagination(options);
//   const { ...filterData } = filters;

//   const andConditions: Prisma.EventParticipantWhereInput[] = [];

//   if (user?.role === Role.USER) {
//     andConditions.push({
//       userId: userInfo.id
//     })
//   }
//   else if (user?.role === Role.HOST) {
//     andConditions.push({
//       eventId: userInfo.id
//     })
//   }

//   if (Object.keys(filterData).length > 0) {
//     const filterConditions = Object.keys(filterData).map(key => ({
//       [key]: {
//         equals: (filterData as any)[key],
//       },
//     }));
//     andConditions.push(...filterConditions);
//   }

//   const whereConditions: Prisma.EventParticipantWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const result = await prisma.eventParticipant.findMany({
//     where: whereConditions,
//     skip,
//     take: limit,
//     orderBy: options.sortBy && options.sortOrder
//       ? { [options.sortBy]: options.sortOrder }
//       : { createdAt: 'desc' },
//     include: user?.role === Role.USER
//       ? { event: true } : { user: true }
//   });

//   const total = await prisma.eventParticipant.count({
//     where: whereConditions,
//   });

//   return {
//     meta: {
//       total,
//       page,
//       limit,
//     },
//     data: result,
//   };
// };




export const EventService = {
  createEvent,
  getAllEvents,
  getMyEvents,
  updateEvent,
  getEventById,
  deleteEvent,
  // users join evint
  joinEvent,
  leaveEvent,
  getAllJoinedEvents,
  getMyUserJoinEvent,


}