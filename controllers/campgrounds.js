const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res, next) => {
  const campgrounds = await Campground.find();
  res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res) => {
  const geolocation = await geocoder.forwardGeocode({
    query: req.body.campground.location,
    limit: 1
  }).send();
  const campground = new Campground(req.body.campground);
  campground.geometry = geolocation.body.features[0].geometry;
  campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
  if (!campground.images.length) {
    campground.images = [{ url: "https://www.flaticon.com/svg/static/icons/svg/1829/1829552.svg", filename: "N/A" }];
  }
  campground.author = req.user._id;
  await campground.save();
  req.flash("success", "Successfully made a new campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id).populate({
    path: "reviews",
    populate: {
      path: "author"
    }
  }).populate("author");
  if (!campground) {
    req.flash("error", "Could not find campground.");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) {
    req.flash("error", "Could not find campground.");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const deleteImages = req.body.deleteImages;
  const opts = { runValidators: true };
  const campground = await Campground.findByIdAndUpdate(req.params.id, { ...req.body.campground }, opts);
  const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
  if (!images.length) {
    images = [{ url: "https://www.flaticon.com/svg/static/icons/svg/1829/1829552.svg", filename: "N/A" }];;
  }
  campground.images.push(...images);
  await campground.save();
  if (deleteImages) {
    for (filename of deleteImages) {
      cloudinary.uploader.destroy(filename);
    };
    await campground.updateOne({ $pull: { images: { filename: { $in: deleteImages } } } });
  }
  req.flash("success", "Updated campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.delete = async (req, res) => {
  const campground = await Campground.findOneAndDelete({ _id: req.params.id });
  req.flash("success", "Campground Deleted.");
  res.redirect("/campgrounds");
};