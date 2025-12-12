
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma";
import { Request } from "express";
import { fileUploader } from "../../helper/fileUploader";
import { Admin, Prisma, Role, UserStatus } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { userSearchableFields } from "./user.constant";
import { IAuthUser } from "../../type/role";

const cerateUser = async (req: Request) => {

    if (req.file) {
        const uploadResult = await fileUploader.uploadToCloudinary(req.file)
        // console.log("upload file", uploadResult)
        req.body.profile.profileImage = uploadResult?.secure_url
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10)

    const result = await prisma.$transaction(async (tnx) => {
        await tnx.user.create({
            data: {
                name: req.body.profile.name,
                email: req.body.profile.email,
                contactNumber: req.body.contactNumber,
                password: hashPassword
            }
        });
        return await tnx.profile.create({
            data: req.body.profile
        })
    })
    return result;

}

const createAdmin = async (req: Request): Promise<Admin> => {

    const file = req.file;
    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        req.body.admin.profileImage = uploadToCloudinary?.secure_url
    }

    const hashedPassword: string = await bcrypt.hash(req.body.password, 10)

    const userData = {
        name: req.body.admin.name,
        email: req.body.admin.email,
        password: hashedPassword,
        role: Role.ADMIN
    }

    const result = await prisma.$transaction(async (transactionClient) => {
        await transactionClient.user.create({
            data: userData
        });

        const createdAdminData = await transactionClient.admin.create({
            data: req.body.admin
        });

        return createdAdminData;
    });

    return result;
};


const getAllUsers = async (params: any, options: IOptions) => {

    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options)
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = []

    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            }))
        })
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    }

    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? {
        AND: andConditions
    } : {}

    const result = await prisma.user.findMany({
        skip,
        take: limit,

        where: whereConditions,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const total = await prisma.user.count({
        where: whereConditions
    });
    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
}


const UpdateMyProfie = async (user: IAuthUser, req: Request) => {

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email,
        }
    });
    const file = req.file;
    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        req.body.profilePhoto = uploadToCloudinary?.secure_url;
    }

    let profileInfo;

    if (userInfo.role === Role.ADMIN) {
        profileInfo = await prisma.admin.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        })
    }
    else if (userInfo.role === Role.USER) {
        profileInfo = await prisma.profile.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        })
    }
    else if (userInfo.role === Role.HOST) {
        profileInfo = await prisma.profile.update({
            where: {
                email: userInfo.email
            },
            data: req.body
        })
    }

    return { ...profileInfo };
}

const getMyProfile = async (user: IAuthUser) => {

    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user?.email,
            status: UserStatus.ACTIVE

        },  
    });

    let profileInfo;

    if (userInfo.role === Role.ADMIN) {
        profileInfo = await prisma.profile.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }
    else if (userInfo.role === Role.USER) {
        profileInfo = await prisma.profile.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }
    else if (userInfo.role === Role.HOST) {
        profileInfo = await prisma.profile.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }
    return { ...userInfo, ...profileInfo };
};

const changeProfileStatus = async (id: string, status: UserStatus) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    });

    const updateUserStatus = await prisma.user.update({
        where: {
            id
        },
        data: status
    });

    return updateUserStatus;
};


export const UserService = {
    cerateUser,
    createAdmin,
    getAllUsers,
    UpdateMyProfie,
    getMyProfile,
    changeProfileStatus,

}






