const User = require("../Models/userModel");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const util = require("util");
const crypto = require("crypto");
const CustomError = require("../Utils/CustomError");
const sendEmail = require("../Utils/email");

//sign-token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

const createSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  //Secure from Cross Site Scripting (XSS) Attack
  const options = {
    maxAge: process.env.LOGIN_EXPIRES,
    httpOnly: true,
    // secure: true,added production env. only
  };
  if (process.env.NODE_ENV === "production") options.secure = true;
  res.cookie("jwt", token, options);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Export the function so it can be used in other files
exports.createSendResponse = createSendResponse;

//Sign-up
exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);
  //     const token = jwt.sign({ id: newUser._id }, process.env.SECRET_STR, {
  //       expiresIn: process.env.LOGIN_EXPIRES,
  //     });//moved to signToken
  // OR
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: "success",
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
  //Moved to a function above
  createSendResponse(newUser, 201, res);
});
//Login
exports.login = asyncErrorHandler(async (req, res, next) => {
  //   const email = req.body.email;
  //   const password = req.body.password;
  // OR
  const { email, password } = req.body;
  //Check if email & password is present in request body
  if (!email || !password) {
    const error = new CustomError(
      "Please provide email ID & Password for login in!",
      400
    );
    return next(error);
  }
  //Check if user exists with given email or not
  const user = await User.findOne({ email }).select("+password");
  //.select("+password"); to get password
  //   const isMatch = await user.comparePasswordIndb(password, user.password);
  //check if the user exists and password matches
  if (!user || !(await user.comparePasswordIndb(password, user.password))) {
    const error = new CustomError("Incorrect email or password", 400);
    return next(error);
  }
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  // OR
  createSendResponse(user, 200, res);
});

exports.protect = asyncErrorHandler(async (req, res, next) => {
  //1. Read the token & check if it exists
  const testToken = req.headers.authorization;
  let token;
  if (testToken && testToken.startsWith("Bearer ")) {
    token = testToken.split(" ")[1];
  }

  if (!token) {
    next(new CustomError("You are not logged in!", 401));
  }

  //2. Validate the token
  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );
  //3. If the user exists
  const user = await User.findById(decodedToken.id);
  if (!user) {
    const error = new CustomError(
      "The user belonging to this token no longer exists.",
      401
    );
    next(error);
  }

  //4. If the user changed password after the  token issued
  const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);
  if (isPasswordChanged) {
    const error = new CustomError(
      "User recently changed password! Please log in again.",
      401
    );
    return next(error);
  }
  //5. Allow user to access route
  req.user = user;
  next();
});

exports.restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      const error = new CustomError(
        "Yo do not have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

//For Application having Multiple roles we can use this
// exports.restrict = (...role) => {
//   return (req, res, next) => {
//     if (!role.includes(req.user.role)) {
//       const error = new CustomError(
//         "Yo do not have permission to perform this action",
//         403
//       );
//       next(error);
//     }
//     next();
//   };
// };

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  //1. GET THE USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const error = new CustomError(
      "We could not find the user with given email",
      404
    );
    return next(error);
  }

  //2. GENERATE A RANDOM RESET TOKEN
  const resetToken = user.createdResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  //3. SEND THE TOKEN BACK TO THE USER EMAIL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `We have received a password reset request. Please use the below link to reset your password\n\n${resetUrl}\n\n This reset password link will be valid only for 10 minutes.`;

  // Debugging: Log the email configuration
  // console.log("Email Configuration:");
  // console.log("Host:", process.env.EMAIL_HOST);
  // console.log("Port:", process.env.EMAIL_PORT);
  // console.log("User:", process.env.EMAIL_USER);
  // console.log("Password:", process.env.EMAIL_PASSWORD);

  try {
    await sendEmail({
      email: user.email,
      subject: "Password change request Received",
      message: message,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset link sent to the user email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new CustomError(
        "There was an error sending password reset email. Please try again later",
        500
      )
    );
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  //1. IF THE USER EXISTS WITH THE GIVEN TOKEN & TOKEN HAS NOT EXPIRED
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpires: { $gte: Date.now() },
  });
  if (!user) {
    const error = new CustomError("Token is invalid or has expired!", 400);
    next(error);
  }
  //2. RESETTING THE USER PASSWORD
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();
  // user.save();
  //3. LOGIN THE USER
  try {
    await user.save();
    // const loginToken = signToken(user._id);
    // res.status(200).json({
    //   status: "success",
    //   token: loginToken,
    // });
    // OR
    createSendResponse(user, 200, res);
  } catch (err) {
    return next(new CustomError(err.message, 400));
  }
});
