import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorize requerst");

    const decodetoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodetoken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Unauthorize requerst");
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(500, "MD: server error");
  }
});
