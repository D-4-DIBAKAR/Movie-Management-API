const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables from config.env file
dotenv.config({ path: "./config.env" });

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.name, err.message);
  console.error("Shutting down due to uncaught exception");
  process.exit(1);
});

// Import Express app
const app = require("./app");

// Log the environment (Development or Production)
console.log(`Environment: ${app.get("env")}`);

// MongoDB connection
mongoose
  .connect(process.env.CONN_STR, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connection successful");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.name, err.message);
  console.error("Shutting down due to unhandled rejection");
  server.close(() => {
    process.exit(1);
  });
});
