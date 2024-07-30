const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Movie = require("../Models/movieModel");
dotenv.config({ path: "./config.env" });
// Connect to MongoDB
mongoose
  .connect(process.env.CONN_STR, {
    useNewUrlParser: true,
  })
  .then((conn) => {
    console.log("MongoDB Connection Successful");
  })
  .catch((err) => {
    console.log("Some error has Occurred");
  });

//READ moves.json file
const movies = JSON.parse(fs.readFileSync("./data/movies.json", "utf-8"));

//DELETE EXISTING MOVIE DOCUMENTS FROM COLLECTION
const deleteMovies = async () => {
  try {
    await Movie.deleteMany({});
    console.log("Data Successfully deleted!");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};
//IMPORT MOVIES DATA TO MONGODB COLLECTION
const importMovies = async () => {
  try {
    await Movie.create(movies);
    console.log("Data Successfully imported!");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};
// console.log(process.argv);
if (process.argv[2] === "--import") {
  importMovies();
}
if (process.argv[2] === "--delete") {
  deleteMovies();
}
