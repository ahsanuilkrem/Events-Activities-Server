import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import { PaymentService } from "./payment.service";
import sendResponse from "../../shared/sendResponse";
import { stripe } from "../../helper/stripe";


// const initPayment = catchAsync(async (req: Request, res: Response) => {
//     const { appointmentId } = req.params;
//     const result = await PaymentService.initPayment(appointmentId);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'Payment initiate successfully',
//         data: result,
//     });
// });

// const validatePayment = catchAsync(async (req: Request, res: Response) => {
//     const result = await PaymentService.validatePayment(req.query);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'Payment validate successfully',
//         data: result,
//     });
// });

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = "whsec_b4c9c68c597866b96e7f78e4e7db5137ed2f3b8a0668d1257d8096ac3426bcad"

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error("⚠️ Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (!event) {
        return;
    }
    const result = await PaymentService.handleStripeWebhookEvent(event);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Webhook req send successfully',
        data: result,
    });
});

export const PaymentController = {
    // initPayment,
    // validatePayment,
    handleStripeWebhookEvent
}