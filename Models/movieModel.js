const mongoose = require("mongoose");
const fs = require("fs");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field!"],
      unique: true,
      maxLength: [100, "Movie name must not exceed 100 characters"],
      minLength: [4, "Movie name must have at least 4 characters"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Description is a required field!"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is a required field!"],
    },
    ratings: {
      type: Number,
      validate: {
        validator: function (value) {
          return value >= 1 && value <= 10;
        },
        message: "Ratings ({VALUE}) must be between 1.0 and 10",
      },
    },
    totalRatings: {
      type: Number,
    },
    releaseYear: {
      type: Number,
      required: [true, "Release year is a required field!"],
    },
    releaseDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    genres: {
      type: [String],
      required: [true, "Genres are required fields!"],
      // Uncomment the below if you want to validate against a specific set of genres
      // enum: {
      //   values: [
      //     "Action",
      //     "Adventure",
      //     "Sci-Fi",
      //     "Thriller",
      //     "Crime",
      //     "Drama",
      //     "Comedy",
      //     "Romance",
      //     "Biography",
      //   ],
      //   message: "This genre does not exist",
      // },
    },
    directors: {
      type: [String],
      required: [true, "Directors are required fields!"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is a required field!"],
    },
    actors: {
      type: [String],
      required: [true, "Actors are required fields!"],
    },
    price: {
      type: Number,
      required: [true, "Price is a required field!"],
    },
    createdBy: {
      type: String,
      default: "DIBAKAR",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

movieSchema.virtual("durationInHours").get(function () {
  return this.duration / 60;
});

// Middleware in Mongoose (Hooks)

// Executed before the document is saved in DB
movieSchema.pre("save", function (next) {
  this.createdBy = "DIBAKAR";
  next();
});

// Executed after the document is saved in DB
movieSchema.post("save", function (doc, next) {
  const content = `A new movie document with name ${doc.name} has been created by ${doc.createdBy}\n`;
  fs.writeFileSync("./Log/Log.txt", content, { flag: "a" });
  next();
});

// Middleware for queries
movieSchema.pre(/^find/, function (next) {
  this.find({ releaseDate: { $lte: Date.now() } });
  this.startTime = Date.now();
  next();
});

movieSchema.post(/^find/, function (docs, next) {
  this.endTime = Date.now();
  const content = `Query took ${
    this.endTime - this.startTime
  } milliseconds to fetch the documents.\n`;
  fs.writeFileSync("./Log/Log.txt", content, { flag: "a" });
  next();
});

// Middleware for aggregation
movieSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({
    $match: { releaseDate: { $lte: new Date() } },
  });
  next();
});

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
