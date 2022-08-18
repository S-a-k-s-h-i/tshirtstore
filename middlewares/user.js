const customError = require("../utils/customError");
const bigPromise = require("./bigPromise");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.isLoggedIn = bigPromise(async (req, res, next) => {
  let token = undefined;
  if (req.cookies.token || req.header("Authorization")) {
    token =
      req.cookies.token || req.header("Authorization").replace("Bearer ", "");
  }

  if (!token)
    return next(new customError("Login first to access this page", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id);

  next();
});

exports.customRole = (...roles) => {
  return (req, res, next) => {
    //check the passed role with the user role
    if (!roles.includes(req.user.role))
      return next(
        new customError("You are not allowed for this resource", 403)
      );

    next();
  };
};
