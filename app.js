// Import Packages
const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// Import Routers and Utilities
const moviesRouter = require("./Routes/moviesRoutes");
const authRouter = require("./Routes/authRouter");
const userRoute = require("./Routes/userRoute");
const CustomError = require("./Utils/CustomError");
const globalErrorHandler = require("./Controllers/errorController");

// Initialize Express App
const app = express();

// Set Security HTTP Headers
app.use(helmet());

// Body Parser, reading data from the body into req.body
app.use(express.json({ limit: "10kb" }));

// Data Sanitization against NoSQL Injection and XSS
app.use(mongoSanitize());
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratings",
      "releaseYear",
      "releaseDate",
      "genres",
      "directors",
      "actors",
      "price",
    ],
  })
);

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate Limiting
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour.",
});
app.use("/api", limiter);

// Serving Static Files
app.use(express.static("./public"));

// Add Request Time to req
app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

// Routes
app.use("/api/v1/movies", moviesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRoute);

// Handle Undefined Routes
app.all("*", (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on the server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
