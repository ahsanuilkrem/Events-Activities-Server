import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthServices } from "./auth.service";


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


export const AuthController = {
   loginUser,
//   refreshToken,
//   changePassword,
//   forgotPassword,
//   resetPassword,
//   getMe
}