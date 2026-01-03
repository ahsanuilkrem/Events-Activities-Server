import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import httpStatus from 'http-status';



const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.loginUser(req.body);
    // console.log(result)
    const { accessToken, refreshToken, userData } = result;

    res.cookie("accessToken", accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24
    })
    res.cookie("refreshToken", refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 90
    })

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "User loggedin successfully!",
        data: {
            userData
        }
    })
})

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const result = await AuthServices.refreshToken(refreshToken);
    res.cookie("accessToken", result.accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60,
    });
});

const changePassword = catchAsync(
    async (req: Request & { user?: any }, res: Response) => {
        const user = req.user;

        const result = await AuthServices.changePassword(user, req.body);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Password Changed successfully",
            data: result,
        });
    }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthServices.forgotPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Check your email!",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  // Extract token from Authorization header (remove "Bearer " prefix)
  const authHeader = req.headers.authorization;
  console.log({ authHeader });
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  const user = req.user; // Will be populated if authenticated via middleware

  await AuthServices.resetPassword(token, req.body, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null,
  });
});

// const resetPassword = catchAsync(async (req: Request, res: Response) => {
//     const token = req.headers.authorization || "";

//     await AuthServices.resetPassword(token, req.body);

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Password Reset!",
//         data: null,
//     });
// });

const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const user = req.cookies;

  const result = await AuthServices.getMe(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

export const AuthController = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe
}