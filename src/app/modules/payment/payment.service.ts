import Stripe from 'stripe';
import { prisma } from '../../../config/prisma';
import { EventStatus, PaymentStatus } from '@prisma/client';
// import { SSLService } from '../SSL/ssl.service';
import { IAuthUser } from '../../type/role';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { stripe } from '../../helper/stripe';


// const initPayment = async (joinEventId: string) => {
//     const paymentData = await prisma.payment.findFirstOrThrow({
//         where: {
//             joinEventId
//         },
//         include: {
//            joinEvent: {
//                 include: {
//                     user: true
//                 }
//             }
//         }
//     });

//     const initPaymentData = {
//         amount: paymentData.amount,
//         transactionId: paymentData.transactionId,
//         name: paymentData.joinEvent.user.name,
//         email: paymentData.joinEvent.user.email,
//         address: paymentData.joinEvent.user.location,
//         // phoneNumber: paymentData.joinEvent.user.
//     }

//     const result = await SSLService.initPayment(initPaymentData);
//     return {
//         paymentUrl: result.GatewayPageURL
//     };

// };

// ssl commerz ipn listener query
// amount=1150.00&bank_tran_id=151114130739MqCBNx5&card_brand=VISA&card_issuer=BRAC+BANK%2C+LTD.&card_issuer_country=Bangladesh&card_issuer_country_code=BD&card_no=432149XXXXXX0667&card_type=VISA-Brac+bank¤cy=BDT&status=VALID&store_amount=1104.00&store_id=progr6606bdd704623&tran_date=2015-11-14+13%3A07%3A12&tran_id=5646dd9d4b484&val_id=151114130742Bj94IBUk4uE5GRj&verify_sign=490d86b8ac5faa016f695b60972a7fac&verify_key=amount%2Cbank_tran_id%2Ccard_brand%2Ccard_issuer%2Ccard_issuer_country%2Ccard_issuer_country_code%2Ccard_no%2Ccard_type%2Ccurrency%2Cstatus%2Cstore_amount%2Cstore_id%2Ctran_date%2Ctran_id%2Cval_id

// const validatePayment = async (payload: any) => {
//     // if (!payload || !payload.status || !(payload.status === 'VALID')) {
//     //     return {
//     //         message: "Invalid Payment!"
//     //     }
//     // }

//     // const response = await SSLService.validatePayment(payload);

//     // if (response?.status !== 'VALID') {
//     //     return {
//     //         message: "Payment Failed!"
//     //     }
//     // }

//     const response = payload;

//     await prisma.$transaction(async (tnx) => {
//         const updatedPaymentData = await tnx.payment.update({
//             where: {
//                 transactionId: response.tran_id
//             },
//             data: {
//                 status: PaymentStatus.SUCCESS ,
//                 paymentGatewayData: response
//             }
//         });

//         await tnx.eventParticipant.update({
//             where: {
//                 id: updatedPaymentData.status
//             },
//             data: {
//                 status: PaymentStatus.SUCCESS
//             }
//         })
//     });

//     return {
//         message: "Payment success!"
//     }

// }


const createEventWithPayLater = async (user: IAuthUser, payload: any) => {
    const userData = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email
        }
    });

    const eventData = await prisma.event.findUniqueOrThrow({
        where: {
            id: payload.id,
          
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
    //  initPayment,
    createEventWithPayLater,
    initiatePaymentForEvent,
    // validatePayment,
    handleStripeWebhookEvent
}