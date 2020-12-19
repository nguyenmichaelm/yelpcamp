const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware");
const reviews = require("../controllers/reviews");

//routes for reviews

router.post("/", isLoggedIn, validateReview,
  catchAsync(reviews.createReview));

router.delete("/:reviewID", isLoggedIn, isReviewAuthor,
  catchAsync(reviews.deleteReview));

router.get("*", reviews.catchAll);

module.exports = router;