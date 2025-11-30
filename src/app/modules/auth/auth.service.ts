import { prisma } from "../../../config/prisma";
import bcrypt from "bcryptjs";
import { jwtHelper } from "../../helper/jwtHelper";
import config from "../../../config";
import { Secret } from "jsonwebtoken";



const loginUser = async (payload: { email: string, password: string }) => {

    // console.log(payload)
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            
        }
    });
    const isCorrectPassword: boolean = await bcrypt.compare(payload.password, userData.password);

    if (!isCorrectPassword) {
        throw new Error("Password incorrect!")
    }
    const accessToken = jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.jwt.jwt_secret as Secret,
        config.jwt.expires_in as string
    );

    const refreshToken = jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    },
        config.jwt.refresh_token_secret as Secret,
        config.jwt.refresh_token_expires_in as string
    );

    return {
        accessToken,
        refreshToken,
        userData
    };
};

// const refreshToken = async (token: string) => {
//     let decodedData;
//     try {
//         decodedData = jwtHelper.verifyToken(token, config.jwt.refresh_token_secret as Secret);
//     }
//     catch (err) {
//         throw new Error("You are not authorized!")
//     }

//     const userData = await prisma.user.findUniqueOrThrow({
//         where: {
//             email: decodedData.email,
//             status: UserStatus.ACTIVE
//         }
//     });

//     const accessToken = jwtHelper.generateToken({
//         email: userData.email,
//         role: userData.role
//     },
//         config.jwt.jwt_secret as Secret,
//         config.jwt.expires_in as string
//     );

//     return {
//         accessToken,
//         needPasswordChange: userData.needPasswordChange
//     };

// };

export const AuthServices = {
    loginUser,
    // refreshToken,
    // changePassword,
    // forgotPassword,
    // resetPassword,
    // getMe
}