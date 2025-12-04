import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/catchAsync';
import pick from '../../helper/pick';
import sendResponse from '../../shared/sendResponse';
import { profileFilterableFields } from './profile.constant';
import { IAuthUser } from '../../type/role';
import { ProfileService } from './profile.service';



const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, profileFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await ProfileService.getAllFromDB(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "profile retrieval successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {

    const { id } = req.params;
    const result = await ProfileService.getByIdFromDB(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile retrieval successfully',
        data: result,
    });
});

const profileDelete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProfileService.profileDelete(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile deleted successfully',
        data: result,
    });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProfileService.softDelete(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile soft deleted successfully',
        data: result,
    });
});

const updateProfile = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await ProfileService.updateProfile(user as IAuthUser, req);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});

export const ProfileController = {
    getAllFromDB,
    getByIdFromDB,
    profileDelete,
    softDelete,
    updateProfile,
};