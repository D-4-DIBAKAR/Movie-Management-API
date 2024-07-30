const CustomError = require("../Utils/CustomError");

// Error response for development environment
const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error,
  });
};

// Error response for production environment
const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong! Please try again later.",
    });
  }
};

// Handle invalid database IDs
const castErrorHandler = (error) => {
  const msg = `Invalid value for ${error.path}: ${error.value}`;
  return new CustomError(msg, 400);
};

// Handle duplicate key errors
const duplicateKeyErrorHandler = (error) => {
  const fieldName = Object.keys(error.keyValue)[0];
  const value = error.keyValue[fieldName];
  const msg = `Duplicate field value: ${fieldName} (${value}). Please use a different value.`;
  return new CustomError(msg, 400);
};

// Handle validation errors
const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data: ${errorMessages}`;
  return new CustomError(msg, 400);
};

// Handle JWT expired errors
const handleExpiredJWT = () => {
  return new CustomError("JWT has expired. Please log in again.", 401);
};

// Handle JWT errors
const handleJWTError = () => {
  return new CustomError("Invalid token. Please log in again.", 401);
};

// Global error handling middleware
module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") error = castErrorHandler(error);
    if (error.code === 11000) error = duplicateKeyErrorHandler(error);
    if (error.name === "ValidationError") error = validationErrorHandler(error);
    if (error.name === "TokenExpiredError") error = handleExpiredJWT();
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    prodErrors(res, error);
  }
};
