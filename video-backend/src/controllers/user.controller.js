import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refeshToken = user.generateRefresToken();
    user.refeshToken = refeshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refeshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong wh");
  }
};

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

const logInUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email us reqired");
  }

  const user = await User.findOne({ $or: [{ uesrname }, { email }] });

  if (!user) throw new ApiError(404, "user dosenot exixt");

  if (!user.isPasswrodCorrect(password))
    throw new ApiError(401, "Invalid user credenials");

  const { accessToken, refeshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refeshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refeshToken", refeshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refeshToken },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
  }

  try {
      const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedToken?._id)
  
      if (!user) {
          throw new ApiError(401, "Invalid refresh token")
      }
  
      if (incomingRefreshToken !== user?.refreshToken) {
          throw new ApiError(401, "Refresh token is expired or used")
          
      }
  
      const options = {
          httpOnly: true,
          secure: true
      }
  
      const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
          new ApiResponse(
              200, 
              {accessToken, refreshToken: newRefreshToken},
              "Access token refreshed"
          )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

export { registerUser, logInUser, logOutUser, refreshAccessToken };
