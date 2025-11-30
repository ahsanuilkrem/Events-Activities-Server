
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma";
import { Request } from "express";
import { fileUploader } from "../../helper/fileUploader";

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
        password: hashPassword
      }
    });
    return await tnx.profile.create({
      data: req.body.profile
    })
  })
  return result;

}

export const UserService = {
  cerateUser
}





