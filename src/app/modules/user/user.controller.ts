import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { userFilterableFields } from "./user.constant";
import { IAuthUser } from "../../type/role";
import  httpStatus  from 'http-status';


const createUser = catchAsync(async (req:Request, res: Response) => {    
    const result = await UserService.cerateUser(req)
    //  console.log("user", req);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "User created successfully!",
        data:  result
    }) 
})

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.createAdmin(req);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Admin Created successfuly!",
        data: result
    })
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, userFilterableFields) // searching , filtering
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) // pagination and sorting

    const result = await UserService.getAllUsers(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrive successfully!",
        meta: result.meta,
        data: result.data
    })
})

const UpdateMyProfie = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await UserService.UpdateMyProfie(user as IAuthUser, req);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My profile updated!",
        data: result
    })
});

const getMyProfile = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {

    const user = req.user;
console.log(user)
    const result = await UserService.getMyProfile(user as IAuthUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My profile data fetched!",
        data: result
    })
});

export const UserController = {
    createUser,
    createAdmin,
    getAllUsers,
    UpdateMyProfie,
    getMyProfile,
}

