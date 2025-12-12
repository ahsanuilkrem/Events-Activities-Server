import { PaymentStatus, Role, } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import  httpStatus  from 'http-status';
import { IAuthUser } from "../../type/role";
import { prisma } from "../../../config/prisma";


const fetchDashboardMetaData = async (user: IAuthUser) => {
    let metaData;
    switch (user?.role) { 
        case Role.ADMIN:
            metaData = getAdminMetaData();
            break;
        case Role.HOST:
            metaData = getHostMetaData(user as IAuthUser);
            break;
        case Role.USER:
            metaData = getUserMetaData(user)
            break;
        default:
            throw new ApiError(httpStatus.BAD_REQUEST,'Invalid user role!')
    }

    return metaData;
};

const getAdminMetaData = async () => {
    const joinEventCount = await prisma.eventParticipant.count();
    const userCount = await prisma.user.count();
    const eventCount = await prisma.event.count();
    const reviewCount = await prisma.review.count();
    const paymentCount = await prisma.payment.count();

    const totalRevenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
            status: PaymentStatus.SUCCESS
        }
    });

    const barChartData = await getBarChartData();
    const pieCharData = await getPieChartData();

    return { joinEventCount, userCount, eventCount, reviewCount, paymentCount, totalRevenue, barChartData, pieCharData }
}
const getHostMetaData = async (user: IAuthUser) => {
    const HostData = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    const eventCount = await prisma.event.count({
        where: {
            hostId: HostData.id
        }
    });

    const joinEventCount = await prisma.eventParticipant.groupBy({
        by: ['eventId'],
        _count: {
            id: true
        }
    });

    const reviewCount = await prisma.review.count({
        where: {
            hostId: HostData.id
        }
    });

    const totalRevenue = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            joinEvent: {
                eventId: HostData.id
            },
            status: PaymentStatus.SUCCESS
        }
    });

    const appointmentStatusDistribution = await prisma.eventParticipant.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
            eventId: HostData.id
        }
    });

    const formattedAppointmentStatusDistribution = appointmentStatusDistribution.map(({ status, _count }) => ({
        status,
        count: Number(_count.id)
    }))

    return {
        eventCount,
        reviewCount,
        joinEventCount: joinEventCount.length,
        totalRevenue,
        formattedAppointmentStatusDistribution
    }
}

const getUserMetaData = async (user: IAuthUser) => {
    const UserData = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    const userCount = await prisma.eventParticipant.count({
        where: {
            userId : UserData.id
        }
    });

    const reviewCount = await prisma.review.count({
        where: {
           userId: UserData.id
        }
    });

    const appointmentStatusDistribution = await prisma.eventParticipant.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
            userId: UserData.id
        }
    });

    const formattedAppointmentStatusDistribution = appointmentStatusDistribution.map(({ status, _count }) => ({
        status,
        count: Number(_count.id)
    }))

    return {
        userCount,
        reviewCount,
        formattedAppointmentStatusDistribution
    }
}

const getBarChartData = async () => {
    const appointmentCountByMonth: { month: Date, count: bigint }[] = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "appointments"
        GROUP BY month
        ORDER BY month ASC
    `

    return appointmentCountByMonth;
};

const getPieChartData = async () => {
    const appointmentStatusDistribution = await prisma.eventParticipant.groupBy({
        by: ['status'],
        _count: { id: true }
    });

    const formattedAppointmentStatusDistribution = appointmentStatusDistribution.map(({ status, _count }) => ({
        status,
        count: Number(_count.id)
    }));

    return formattedAppointmentStatusDistribution;
}

export const MetaService = {
    fetchDashboardMetaData
}