
import { Prisma, Profile } from '@prisma/client';
import { IOptions, paginationHelper } from '../../helper/paginationHelper';
import { profileSearchableFields } from './profile.constant';
import { IProfileFilterRequest } from './profile.interface';
import { prisma } from '../../../config/prisma';
import { IAuthUser } from '../../type/role';
import { Request } from 'express';
import { fileUploader } from '../../helper/fileUploader';
import { ProfileValidation } from './profile.validation';



const getAllFromDB = async (
    filters: IProfileFilterRequest,
    options: IOptions,
) => {
    const { limit, page, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = filters;

    const andConditions = [];

    if (searchTerm) {
        andConditions.push({
            OR: profileSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => {
                return {
                    [key]: {
                        equals: (filterData as any)[key],
                    },
                };
            }),
        });
    }
    andConditions.push({
        isDeleted: false,
    });

    const whereConditions: Prisma.ProfileWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.profile.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? { [options.sortBy]: options.sortOrder }
                : {
                    createdAt: 'desc',
                }
    });
    const total = await prisma.profile.count({
        where: whereConditions,
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
};

const getByIdFromDB = async (id: string): Promise<Profile | null> => {

    const result = await prisma.profile.findFirst({
        where: {
            id,
            isDeleted: false,
        },
   
    });

    return result;
};

const profileDelete = async (id: string): Promise<Profile | null> => {
    return await prisma.$transaction(async transactionClient => {
        const deletedProfile = await transactionClient.profile.delete({
            where: { id },
          
        });

        await transactionClient.user.delete({
            where: {
                email: deletedProfile.email,
            },
           
        });

        return deletedProfile;
    });
};

const softDelete = async (id: string): Promise<Profile | null> => {
    return await prisma.$transaction(async transactionClient => {
        const deletedProfile = await transactionClient.profile.update({
            where: { id },
            data: {
                isDeleted: true,
            },
        });

        await transactionClient.user.update({
            where: {
                email: deletedProfile.email,
            },
             data: {
                // status: UserStatus.DELETED,
            }, 
        });

        return deletedProfile;
    });
};

const updateProfile = async (user: IAuthUser, req: Request) => {

     const file = req.file;
       if (file) {
           const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
           req.body.profileImage = uploadToCloudinary?.secure_url;
       }

    const profileInfo = await prisma.profile.findUniqueOrThrow({
        where: {
            email: user?.email,
            isDeleted: false
        }
    });

    return await prisma.$transaction(async (tnx) => {
      const result = await tnx.profile.update({
            where: {
                id: profileInfo.id
            },
            data: req.body,
        })

        return result;
    })

}

export const ProfileService = {
    getAllFromDB,
    getByIdFromDB,
    profileDelete,
    softDelete,
    updateProfile,
};

