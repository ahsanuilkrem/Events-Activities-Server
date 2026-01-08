import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import { PaymentService } from "./payment.service";
import sendResponse from "../../shared/sendResponse";
import { stripe } from "../../helper/stripe";
import { IAuthUser } from "../../type/role";
import config from "../../../config";


const createEventWithPayLater = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const { eventId } = req.body;
    const result = await PaymentService.createEventWithPayLater(user as IAuthUser, eventId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event join successfully! You can pay later.",
        data: result
    })
});

const initiatePayment = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const { id } = req.params;

    const result = await PaymentService.initiatePaymentForEvent(id, user as IAuthUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment session created successfully",
        data: result
    })
})

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripeWebhookSecret as string;
    // const webhookSecret = "whsec_b4c9c68c597866b96e7f78e4e7db5137ed2f3b8a0668d1257d8096ac3426bcad"

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
    createEventWithPayLater,
    initiatePayment,
    handleStripeWebhookEvent
}