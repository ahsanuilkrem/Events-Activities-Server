import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../../config/prisma";
import ApiError from "../../errors/ApiError";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { IAuthUser } from "../../type/role";
import { stripe } from "../../helper/stripe";


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

// const getMyUserJoinEvent = async (userId: string) => {

//   const result = await prisma.eventParticipant.findMany({
//     where: {
//       userId
//     },
//     include: {
//       event: true,
//       payment: {
//         select: {
//           id: true,
//           userId: true,
//           eventId: true,
//           transactionId: true,
//           amount: true,
//           status: true,
//           createdAt: true,
//           updatedAt: true,
//         }
//       },
//     },
//   });

//   const total = await prisma.eventParticipant.count({
//     where: {
//       userId
//     },

//   });
//   return {
//     meta: {
//       total
//     },
//     data: result,
//   };
// };


const getMyEventById = async (id: string) => {
  // console.log(id)
  const event = await prisma.eventParticipant.findUnique({
    where: { id },
    include: {
      event: true,
      review: true,       
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

  // if (!event) {
  //   throw new ApiError(404, "Event not found");
  // }

  return event;
};


const getMyUserJoinEvent = async (user: IAuthUser, filters: any, options: IOptions) => {

  const userInfo = await prisma.profile.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { ...filterData } = filters;

  const andConditions: Prisma.EventParticipantWhereInput[] = [];

  if (user?.role === Role.USER) {
    andConditions.push({
      userId: userInfo.id
    })
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map(key => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));
    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.EventParticipantWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.eventParticipant.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy && options.sortOrder
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: 'desc' },
      include: {
         user: true,
         event: true,
      }
      
       
    // include: user?.role === Role.USER
    //   ? { event: true } : { user: true },
   
  });

  const total = await prisma.eventParticipant.count({
    where: whereConditions,
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


export const EventService = {
  joinEvent,
  leaveEvent,
  getAllJoinedEvents,
  getMyUserJoinEvent,
  getMyEventById


}