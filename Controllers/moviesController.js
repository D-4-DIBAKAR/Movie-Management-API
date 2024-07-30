const Movie = require("../Models/movieModel");
const ApiFeatures = require("../Utils/ApiFeatures");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const CustomError = require("../Utils/CustomError");

exports.addMovie = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({
    status: "success",
    data: { movie },
  });
});

exports.getAllMovies = asyncErrorHandler(async (req, res, next) => {
  const features = new ApiFeatures(Movie.find(), req.query)
    .sort()
    .filter()
    .limitFields()
    .paginate();
  const movies = await features.query;
  res.status(200).json({
    status: "success",
    results: movies.length,
    data: { movies },
  });
});

exports.getMovie = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    return next(new CustomError("Movie with that ID is not found!", 404));
  }
  res.status(200).json({
    status: "success",
    data: { movie },
  });
});

exports.updateMovie = asyncErrorHandler(async (req, res, next) => {
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedMovie) {
    return next(new CustomError("Movie with that ID is not found!", 404));
  }
  res.status(200).json({
    status: "success",
    data: { movie: updatedMovie },
  });
});

exports.deleteMovie = asyncErrorHandler(async (req, res, next) => {
  const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
  if (!deletedMovie) {
    return next(new CustomError("Movie with that ID is not found!", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getHighestRated = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratings";
  next();
};

exports.getMovieStats = asyncErrorHandler(async (req, res, next) => {
  const stats = await Movie.aggregate([
    { $match: { ratings: { $gte: 8 } } },
    {
      $group: {
        _id: "$releaseYear",
        avgRating: { $avg: "$ratings" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        priceTotal: { $sum: "$price" },
        movieCount: { $sum: 1 },
      },
    },
    { $sort: { minPrice: 1 } },
    { $match: { maxPrice: { $gte: 15 } } },
  ]);
  res.status(200).json({
    status: "success",
    count: stats.length,
    data: { stats },
  });
});

exports.getMovieByGenre = asyncErrorHandler(async (req, res, next) => {
  const genre = req.params.genre;
  const movies = await Movie.aggregate([
    { $unwind: "$genres" },
    {
      $group: {
        _id: "$genres",
        movieCount: { $sum: 1 },
        movies: { $push: "$name" },
      },
    },
    { $addFields: { genre: "$_id" } },
    { $project: { _id: 0 } },
    { $sort: { movieCount: -1 } },
    { $match: { genre } },
  ]);
  res.status(200).json({
    status: "success",
    count: movies.length,
    data: { movies },
  });
});
