
import  express  from 'express';

const router = express.Router();

router.get(
    '/ipn',
    // PaymentController.validatePayment
)

// router.post(
//     '/init-payment/:appointmentId',
//     PaymentController.initPayment
// )

export const PaymentRoutes = router;

// stripe listen --forward-to localhost:5000/webhook