// import { hasAutoParseableInput } from "openai/lib/parser";
// import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from 'http-status' 
// import { IPaginationOptions } from "../../interfaces/pagination";
// import { paginationHelper } from "../../helper/paginationHelper";
// import { Prisma } from "@prisma/client";
import { IAuthUser } from "../../type/role";
import { prisma } from "../../../config/prisma";


const insertIntoDB = async (user: IAuthUser, payload: any) => {
    const UserData = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    const joinEventData = await prisma.eventParticipant.findUniqueOrThrow({
        where: {
            id: payload.joinEventId
        }
    });

    if (UserData.id !== joinEventData.userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This is not your appointment!")
    }

    return await prisma.$transaction(async (tnx) => {
        const result = await tnx.review.create({
            data: {
                joinEventId: joinEventData.id,
                userId: UserData.id,
                eventId:joinEventData.eventId,
                hostId: UserData.id,
                rating: payload.rating,
                comment: payload.comment
            }
        });

        const avgRating = await tnx.review.aggregate({
            _avg: {
                rating: true
            },
            where: {
                eventId: joinEventData.eventId,
            }
        })

        await tnx.event.update({
            where: {
                id: joinEventData.eventId,
            },
            data: {
                averageRating: avgRating._avg.rating as number
            }
        })

        return result;
    })
};

// const getAllFromDB = async (
//     filters: any,
//     options: IPaginationOptions,
// ) => {
//     const { limit, page, skip } = paginationHelper.calculatePagination(options);
//     const { patientEmail, doctorEmail } = filters;
//     const andConditions = [];

//     if (patientEmail) {
//         andConditions.push({
//             patient: {
//                 email: patientEmail
//             }
//         })
//     }

//     if (doctorEmail) {
//         andConditions.push({
//             doctor: {
//                 email: doctorEmail
//             }
//         })
//     }

//     const whereConditions: Prisma.ReviewWhereInput =
//         andConditions.length > 0 ? { AND: andConditions } : {};

//     const result = await prisma.review.findMany({
//         where: whereConditions,
//         skip,
//         take: limit,
//         orderBy:
//             options.sortBy && options.sortOrder
//                 ? { [options.sortBy]: options.sortOrder }
//                 : {
//                     createdAt: 'desc',
//                 },
//         include: {
//             doctor: true,
//             patient: true,
//             //appointment: true,
//         },
//     });
//     const total = await prisma.review.count({
//         where: whereConditions,
//     });

//     return {
//         meta: {
//             total,
//             page,
//             limit,
//         },
//         data: result,
//     };
// };

export const ReviewService = {
    insertIntoDB,
    // getAllFromDB
}

