import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import pick from "../../helper/pick";
import sendResponse from "../../shared/sendResponse";
import httpStatus from 'http-status';
import { EventService } from "./event.service";
import { IAuthUser } from "../../type/role";
import { EventFilterableFields } from "./event.constant";
import { stripe } from './../../helper/stripe';


const createEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const user = req.user;
  // console.log("body", req.body)  
  // console.log("user", hostId);
  const result = await EventService.createEvent(user as IAuthUser, req)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully!",
    data: result
  })
})

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, EventFilterableFields) // searching , filtering
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) // pagination and sorting
  const result = await EventService.getAllEvents(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Events fetched successfully!",
    meta: result.meta,
    data: result.data
  })
})

const getMyEvents = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const filters = pick(req.query, EventFilterableFields) // searching , filtering
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) // pagination and sorting
  const user = req.user;

  const result = await EventService.getMyEvents(filters, options, user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My Event fetched successfully!",
    data: result
  });
});

const updateEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {

  const { id } = req.params;
  const user = req.user; // from auth middleware (JWT decoded)
  const result = await EventService.updateEvent(id, req, user as IAuthUser,);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event updated successfully!",
    data: result,
  });
});

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const event = await EventService.getEventById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event fetched successfully",
    data: event,
  });
}
);

// Delete event (host only)
const deleteEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const result = await EventService.deleteEvent(id, user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: undefined
  });


})

//All users join event

const joinEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params;  // Event ID
  const user = req.user;  // From JWT auth
  const participant = await EventService.joinEvent(id, user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Joined event successfully",
    data: participant,
  });
}
);

const leaveEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params; // Event ID
  const user = req.user; // From JWT auth

  const result = await EventService.leaveEvent(id, user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: undefined
  });
}
);

// const getAlljoinEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
//   const user = req.user;  // From JWT auth
//   const participant = await EventService.getAllJoinedEvents(user as IAuthUser);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "all join event successfully",
//     data: participant,
//   });
// }
// );

const getMyUserJoinEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const userId = req.params.id;
  console.log(userId)
  const result = await EventService.getMyUserJoinEvent(userId)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My join Event retrive successfully',
    data: result
  });
});

// const getMyUserJoinEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
//   const user = req.user;
//   console.log(user)
//   const filters = pick(req.query, ['status']);
//   const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

//   const result = await EventService.getMyUserJoinEvent(user as IAuthUser, filters, options);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'My Event retrive successfully',
//     meta: result.meta,
//     data: result.data,

//   });
// });




export const EventController = {
  createEvent,
  getAllEvents,
  getMyEvents,
  updateEvent,
  getEventById,
  deleteEvent,
  // user join event
  joinEvent,
  leaveEvent,
  getMyUserJoinEvent,


}