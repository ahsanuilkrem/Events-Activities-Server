
import express, { NextFunction, Request, Response }  from 'express';
import { UserController } from './user.controller';
import { fileUploader } from '../../helper/fileUploader';
import { UserValidation } from './user.validation';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

router.get(
    "/",
     auth(Role.ADMIN),
    UserController.getAllUsers
)

router.get(
    '/me',
    auth(Role.ADMIN, Role.USER, Role.HOST),
    UserController.getMyProfile
)

router.post(
    "/create-user",
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = UserValidation.createUserValidation.parse(JSON.parse(req.body.data))
        return UserController.createUser(req, res, next)
    }
)

router.post(
    "/create-admin",
    // auth(UserRole.ADMIN),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = UserValidation.createAdmin.parse(JSON.parse(req.body.data))
        return UserController.createAdmin(req, res, next)
    }
);

router.patch(
    "/update-my-profile",
    auth(Role.ADMIN, Role.USER, Role.HOST),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = JSON.parse(req.body.data)
        return UserController.UpdateMyProfie(req, res, next)
    }
);

router.patch(
    '/:id/status',
    auth(Role.ADMIN),
    validateRequest(UserValidation.updateStatus),
    UserController.changeProfileStatus
);

export const userRoutes = router;