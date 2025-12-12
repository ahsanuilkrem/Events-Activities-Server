
import express  from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { MetaController } from './meta.controller';

const router = express.Router();

router.get(
    '/',
    auth(Role.ADMIN, Role.HOST, Role.USER),
    MetaController.fetchDashboardMetaData
)


export const MetaRoutes = router;