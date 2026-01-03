
import express from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { EventRoutes } from '../modules/events/event.routes';
import { ProfileRoutes } from '../modules/Profile/profile.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { JoinEventRoutes } from '../modules/myEvent/myEvent.routes';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/user',
        route: userRoutes,
    },
    {
        path: '/auth',
        route: AuthRoutes,
    },
    {
        path: '/event',
        route: EventRoutes,
    },
    {
        path: '/profile',
        route: ProfileRoutes,
    },
    {
        path: '/review',
        route: ReviewRoutes,
    },
    {
        path: '/payment',
        route: PaymentRoutes,
    },
    {
        path: '/joinEvent',
        route: JoinEventRoutes,
    },


];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;