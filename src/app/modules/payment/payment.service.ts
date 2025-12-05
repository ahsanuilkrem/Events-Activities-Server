import Stripe from 'stripe';
import { prisma } from '../../../config/prisma';
import { PaymentStatus } from '@prisma/client';
// import { SSLService } from '../SSL/ssl.service';



// const initPayment = async (appointmentId: string) => {
//     const paymentData = await prisma.payment.findFirstOrThrow({
//         where: {
//             appointmentId
//         },
//         include: {
//             appointment: {
//                 include: {
//                     patient: true
//                 }
//             }
//         }
//     });

//     const initPaymentData = {
//         amount: paymentData.amount,
//         transactionId: paymentData.transactionId,
//         name: paymentData.appointment.patient.name,
//         email: paymentData.appointment.patient.email,
//         address: paymentData.appointment.patient.address,
//         phoneNumber: paymentData.appointment.patient.contactNumber
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
    // initPayment,
    // validatePayment,
    handleStripeWebhookEvent
}