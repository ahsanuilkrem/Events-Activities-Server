
import express from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { EventRoutes } from '../modules/events/event.routes';
import { ProfileRoutes } from '../modules/Profile/profile.routes';
import { ReviewRoutes } from '../modules/review/review.routes';

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


];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;