
import express, { NextFunction, Request, Response }  from 'express';
import { EventController } from './event.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { fileUploader } from '../../helper/fileUploader';
import { EventValidation } from './event.validation';

const router = express.Router();

router.get(
    "/",
     auth(Role.ADMIN, Role.HOST, Role.USER),
    EventController.getAllEvents
)

router.get("/:id", 
    auth(Role.HOST, Role.ADMIN, Role.USER),
    EventController.getEventById 
);

router.post(
    "/create-event",
    auth(Role.ADMIN, Role.HOST),
     fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = EventValidation.createEventValidation.parse(JSON.parse(req.body.data))
        return EventController.createEvent(req, res, next)
    }  
)

router.delete("/:id", 
    auth(Role.HOST, Role.ADMIN),
    EventController.deleteEvent    
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.HOST, Role.USER),
     fileUploader.upload.single('file'),
     (req: Request, res: Response, next: NextFunction) => {
        req.body = EventValidation.updateEventValidation.parse(JSON.parse(req.body.data))
        return EventController.updateEvent(req, res, next)
    }
);


// All users join event

// router.get("/allJoinedEvent", 
//     auth(Role.ADMIN, Role.HOST, Role.USER), 
//     EventController.getAlljoinEvent);

router.post("/:id/join", 
    auth(Role.USER, Role.HOST, Role.ADMIN),
    EventController.joinEvent    
);

router.get(
    '/:id/my-event',
    auth(Role.HOST, Role.USER),
    EventController.getMyUserJoinEvent
)

router.delete("/:id/leave", 
    auth(Role.USER, Role.HOST, Role.ADMIN),
    EventController.leaveEvent    
); 



export const EventRoutes = router;










