const express = require("express");
const moviesController = require("../Controllers/moviesController");
const authController = require("../Controllers/authController");
const router = express.Router();
//Param MiddleWare
// router.param("id", (req, res, next, value) => {
//   console.log(`Movie ID Is ${value}`);
//   next();
// });
//Moved to Controller
// router.param("id", moviesController.checkId);

//Aliasing a Route
//localhost:5000/api/v1/movies/?limit=5&sort=-ratings ---> http://localhost:5000/api/v1/movies/highest-rated
router
  .route("/highest-rated")
  .get(moviesController.getHighestRated, moviesController.getAllMovies);
router.route("/movie-stats").get(moviesController.getMovieStats);
router.route("/movies-by-genre/:genre").get(moviesController.getMovieByGenre);
router
  .route("/")
  .get(authController.protect, moviesController.getAllMovies)
  .post(moviesController.addMovie);
// router
//   .route("/")
//   .get(asyncErrorHandler(moviesController.getAllMovies))//**Also Use asyncErrorHandler here for the async functions only but recommended use it inside controller ,no need to remember which are async or not*/
//   .post(moviesController.addMovie);
router
  .route("/:id")
  .get(authController.protect, moviesController.getMovie)
  .patch(moviesController.updateMovie)
  .delete(
    authController.protect,
    authController.restrict("admin"),
    moviesController.deleteMovie
  );

module.exports = router;
