
import  express  from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';


const router = express.Router();

// router.get(
//     '/ipn',
//     // PaymentController.validatePayment
// )

// router.post(
//     '/init-payment/:joinEventId',
//     PaymentController.initPayment
// )


router.post(
    '/pay-later',
    auth(Role.USER),
    // validateRequest(Appoin.createAppointment),
    PaymentController.createEventWithPayLater
);

router.post(
    '/:id/initiate-payment',
    auth(Role.USER),
    // paymentLimiter,
    PaymentController.initiatePayment
);

export const PaymentRoutes = router;

// stripe listen --forward-to localhost:5000/webhook