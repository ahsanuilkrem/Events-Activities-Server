import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { IAuthUser } from "../../type/role";
import { EventService } from "./myEvent.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus  from 'http-status';
import pick from "../../helper/pick";



const joinEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { eventId } = req.body;
  const user = req.user;  
  const participant = await EventService.joinEvent(eventId, user as IAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Joined event successfully",
    data: participant,
  });
}
);

const leaveEvent = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params; 
  const user = req.user; 

  const result = await EventService.leaveEvent(id, user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: undefined
  });
}
);


const getmyEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const event = await EventService.getMyEventById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My Event fetched successfully",
    data: event,
  });
}
);


const getMyUserJoinEvent = catchAsync( async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const filters = pick(req.query, ['status']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await EventService.getMyUserJoinEvent(user as IAuthUser, filters, options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'My joined events retrieved successfully',
      data: result,
    });
  }
);


export const EventController = {
  joinEvent,
  leaveEvent,
  getMyUserJoinEvent,
  getmyEventById


}