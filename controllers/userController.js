const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const sendMail = require("../utils/mailHelper");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!req.files) return next(new CustomError("Please provide a photo", 400));

  if (!email || !name || !password)
    return next(new CustomError("Name,email and password are required", 400));

  let file = req.files.photo;
  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });
  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  //check for the presence of email and password
  if (!email || !password)
    return next(new CustomError("Please provide email and password", 400));

  //get the user from db
  const user = await User.findOne({ email }).select("+password");

  //if user doesn't exist
  if (!user)
    return next(new CustomError("User doesn't exist with this email", 400));

  const isPasswordCorrect = await user.isValidatedPassword(password);

  //If password doesn't match
  if (!isPasswordCorrect)
    return next(new CustomError("Email or Password doesn't match", 400));

  //if everything goes well we return the token
  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  //delete token
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .status(200)
    .json({
      success: true,
      message: "Logout Success",
    });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  //find email from database
  const user = await User.findOne({ email });

  //if user doesn't exist throw error
  if (!user) next(new CustomError("Email doesn't exist", 500));

  //get token from user model method
  const forgotToken = await user.forgotPassToken();

  //save user fields in DB
  await user.save({ validateBeforeSave: false });

  //create a URL
  const myUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  //craft a message
  const message = `Copy paste this link in the url and hit enter \n\n ${myUrl}`;

  //send mail
  try {
    await sendMail({
      toEmail: user.email,
      subject: "TStore - Password Reset Email",
      message,
    });
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

exports.resetToken = BigPromise(async (req, res, next) => {
  const token = req.params.token;

  const encryptedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    encryptedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  //if user not found
  if (!user) return next(new CustomError("Token is invalid or expired", 400));

  //compare the password with confirm password
  if (req.body.password !== req.body.confirmPassword)
    return next(
      new CustomError("Password and confirm password do not match", 400)
    );

  user.password = req.body.password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  //return a json response or a token
  cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  //req.user will be added by middleware
  //find user by id
  const user = await User.findById(req.user.id);

  //send response and user data
  res.status(200).json({
    success: true,
    user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  //req.user will be added by the middleware and fetching the id then
  const userId = req.user.id;

  //fetching the user by id
  const user = await User.findById(userId).select("+password");

  const isOldCorrectPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isOldCorrectPassword)
    return next(new CustomError("Old password is incorrect", 400));

  if (req.body.newPassword !== req.body.confirmPassword)
    return next(
      new CustomError("password and confirm password do not match", 400)
    );

  //update password with new password
  user.password = req.body.newPassword;

  await user.save();

  //if everything goes well we return a new token
  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  if (!req.body.name && !req.body.email)
    return next(new CustomError("Please provide name and email", 400));

  const newData = {
    name: req.body.name,
    email: req.body.email,
  };
  if (req.files) {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;

    //delete photo from cloudinary
    const resp = await cloudinary.v2.uploader.destroy(imageId);

    //upload new photo
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    //update photo
    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    success: true,
    user,
  });
});

exports.admingetAllUsers = BigPromise(async (req, res, next) => {
  //get all users
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

exports.managergetAllUsers = BigPromise(async (req, res, next) => {
  //get all users with role as users
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});

exports.adminGetUserById = BigPromise(async (req, res, next) => {
  //get the user by id
  const user = await User.findById(req.params.id);

  //user not found
  if (!user) return next(new CustomError("User not found", 400));

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new CustomError("User not found", 404));

  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const updatedUser = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    updatedUser,
  });
});

exports.adminDeleteUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new CustomError("User not found", 404));

  //delete images
  const imageId = user.photo.id;
  await cloudinary.v2.uploader.destroy(imageId);

  //delete user
  await User.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
