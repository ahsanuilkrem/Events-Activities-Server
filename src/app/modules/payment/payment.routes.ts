
import  express  from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { paymentLimiter } from '../../middlewares/rateLimiter';
import validateRequest from '../../middlewares/validateRequest';
import { EventJoinValidation } from './payment.validation';


const router = express.Router();

router.post(
    '/pay-later',
    auth(Role.USER, Role.ADMIN),
    validateRequest(EventJoinValidation.createEventJoin),
    PaymentController.createEventWithPayLater
);

router.post(
    '/:id/initiate-payment',
    auth(Role.USER),
    paymentLimiter,
    PaymentController.initiatePayment
);

export const PaymentRoutes = router;

