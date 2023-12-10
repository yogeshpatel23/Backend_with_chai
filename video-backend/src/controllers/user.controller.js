import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username, email }] });

  if (existedUser) throw new ApiError(409, "username or email already exists.");

  const avatarLoaclpath = req.files?.avatar[0]?.path;
  // const coverLoaclpath = req.files?.coverImage[0]?.path;

  let coverLoaclpath;
  if (
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage.lenght > 0
  ) {
    coverLoaclpath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLoaclpath) throw new ApiError(400, "Avartar Image is required");

  const avatar = await uploadOnCloudinary(avatarLoaclpath);
  const coverImage = await uploadOnCloudinary(coverLoaclpath);

  if (!avatar) throw new ApiError(500, "Avatr uplode faild");

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const newUser = await User.findById(user._id).select(
    "-password -refeshToken"
  );

  if (!newUser)
    throw new ApiError(500, "something went wrong while create user");

  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "User Register successfully"));
});

export { registerUser };
