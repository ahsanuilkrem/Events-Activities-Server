import Stripe from 'stripe';
import { prisma } from '../../../config/prisma';
import { EventStatus, PaymentStatus } from '@prisma/client';
import { IAuthUser } from '../../type/role';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { stripe } from '../../helper/stripe';



const createEventWithPayLater = async (user: IAuthUser, eventId: string) => {
    const userData = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    const eventData = await prisma.event.findUniqueOrThrow({
        where: {
            id: eventId,
          
        }
    });

    const result = await prisma.$transaction(async (tnx) => {
        const joinEventData = await tnx.eventParticipant.create({
            data: {
                userId: userData.id,
                eventId: eventData.id,
            },
            include: {
                user: true,
                event: true,

            }
        })

        const today = new Date();
        const transactionId = "Event-Activites-" + today.getFullYear() + "-" + today.getMonth() + "-" + today.getDay() + "-" + today.getHours() + "-" + today.getMinutes();


        await tnx.payment.create({
            data: {
                userId: userData.id,
                eventId: eventData.id,
                joinEventId: joinEventData.id,
                amount: eventData.fee,
                transactionId
            }
        })

        return joinEventData;
    })

    return result;
};

const initiatePaymentForEvent = async (joinEventId: string, user: IAuthUser) => {
    const userData = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    const event = await prisma.eventParticipant.findUnique({
        where: {
            id: joinEventId,
            userId: userData.id
        },
        include: {
            payment: true,
            event: true
        }
    });

    if (!event) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Event not found or unauthorized");
    }

     if (event.event.status === EventStatus.CANCELLED) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot pay for cancelled Event");
    }

    if (event.payment?.status === PaymentStatus.SUCCESS) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment already completed for this Event");
    }


    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: user?.email || '',
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Event Name with ${event.event.EventName}`,
                    },
                    unit_amount: event.payment!.amount * 100,
                },
                quantity: 1,
            },
        ],
        metadata: {
            joinEventId: event.id,
            paymentId: event.payment!.id
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/my-event`,
    });
//    console.log("session", session)
    return { paymentUrl: session.url };
};


const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;

            // const eventId = session.metadata?.eventId;
            const joinEventId = session.metadata?.joinEventId;
            const paymentId = session.metadata?.paymentId;

            await prisma.eventParticipant.update({
                where: {
                    id: joinEventId
                },
                data: {
                    status: session.payment_status === "paid" ? PaymentStatus.SUCCESS : PaymentStatus.FAILED
                }
            })

            await prisma.payment.update({
                where: {
                    id: paymentId
                },
                data: {
                    status: session.payment_status === "paid" ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
                    paymentGatewayData: session
                }
            })

            break;
        }

        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
};

export const PaymentService = {
    createEventWithPayLater,
    initiatePaymentForEvent,
    handleStripeWebhookEvent
}