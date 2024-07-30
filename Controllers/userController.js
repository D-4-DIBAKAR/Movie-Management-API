const User = require("../Models/userModel");
const { createSendResponse } = require("./authController");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const CustomError = require("../Utils/CustomError");

// Get all users
exports.getAllUser = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    result: users.length,
    data: { users },
  });
});

// Filter request object
const filterReqObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (allowedFields.includes(prop)) {
      newObj[prop] = obj[prop];
    }
  });
  return newObj;
};

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  // Get the current user data from database
  const user = await User.findById(req.user._id).select("+password");

  // Check if the supplied current password is correct
  if (
    !(await user.comparePasswordIndb(req.body.currentPassword, user.password))
  ) {
    return next(
      new CustomError("The current password you provided is incorrect", 401)
    );
  }

  // If the supplied password is correct, update user password with new value
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // Log in user & send JWT
  createSendResponse(user, 200, res);
});

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  // Check if request data contains password or confirmPassword
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new CustomError(
        "You cannot update your password using this endpoint",
        400
      )
    );
  }

  // Update current user details
  const filterObj = filterReqObj(req.body, "name", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObj, {
    runValidators: true,
    new: true,
  });

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

// Delete current user
exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});
