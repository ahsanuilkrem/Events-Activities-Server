
import express  from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { EventController } from './myEvent.controller';

const router = express.Router();

// router.get("/allJoinedEvent", 
//     auth(Role.ADMIN, Role.HOST, Role.USER), 
//     EventController.getAlljoinEvent);

router.post("/", 
    auth(Role.USER, Role.HOST, Role.ADMIN),
    EventController.joinEvent    
);


router.get(
    '/my-joinEvent',
    auth(Role.HOST, Role.USER),
    EventController.getMyUserJoinEvent
)

router.get("/eventId/:id", 
    auth(Role.HOST, Role.ADMIN, Role.USER),
    EventController.getmyEventById 
);
router.delete("/:id/leave", 
    auth(Role.USER, Role.HOST, Role.ADMIN),
    EventController.leaveEvent    
); 




export const JoinEventRoutes = router;
