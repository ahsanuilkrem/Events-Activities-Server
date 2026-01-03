
import express, { NextFunction, Request, Response }  from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { ProfileController } from './profile.controller';
import { fileUploader } from '../../helper/fileUploader';



const router = express.Router();

router.get(
    "/",
     auth(Role.ADMIN, Role.HOST, Role.USER),
    ProfileController.getAllFromDB
)

router.get("/:id", 
    auth(Role.HOST, Role.ADMIN, Role.USER),
    ProfileController.getByIdFromDB 
);

router.delete("/:id", 
    auth(Role.HOST, Role.ADMIN, Role.USER),
    ProfileController.profileDelete   
);

router.delete("/softDelete/:id", 
    auth(Role.HOST, Role.ADMIN, Role.USER),
    ProfileController.softDelete   
);

router.patch(
  "/update",
  auth(Role.ADMIN, Role.HOST, Role.USER),
     fileUploader.upload.single('file'),
     (req: Request, res: Response, next: NextFunction) => {
        req.body = JSON.parse(req.body.data)
        return ProfileController.updateProfile(req, res, next)
    }
);



export const ProfileRoutes = router;










