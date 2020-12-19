if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
};

//required modules
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const engine = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const MongoStore = require("connect-mongo")(session);

//connecting to mongodb
// process.env.DB_URL ||
const dbUrl =  "mongodb://localhost:27017/yelp-camp";
mongoose.connect(dbUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

//verify connection to mongodb
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Database Connected!")
});

//settings
const app = express();

app.engine("ejs", engine);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());
app.use(helmet());


//used for helmet... for more security with headers
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];

const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net/",
];

const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];

const fontSrcUrls = [];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/nguyenmichaelm/",
        "https://images.unsplash.com/",
        "https://www.flaticon.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

//use setup session
const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const store = new MongoStore({
  url: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionConfig));
app.use(flash());



//use to configure part of passport/passport-local
app.use(passport.initialize()); //needed to initialize passport
app.use(passport.session());  //needed for persistent session, has to be after session();
passport.use(new LocalStrategy(User.authenticate())); //tells passport to use local Strategy, and the authentication method is on User.authenticate (which from passport-local)

passport.serializeUser(User.serializeUser()); //how store a user in a session
passport.deserializeUser(User.deserializeUser()); //how to unstore a user in a session


//middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;

  next();
});

//=======Routes=======

//if user DB has been deleted,
//use this route after seeding data for author to be vaild
app.get("/fakeUser", async (req, res) => {
  const user = new User({
    email: "fake@mail.com",
    username: "fakeuser",
    _id: "5fdbe48d202c73379859191d"
  })
  const newUser = await User.register(user, "password");
  res.send(newUser);
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
})

//routes for error handling
app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
})

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, Something Went Wrong!"
  res.status(statusCode).render("error", { err });
});

//route to connect to port
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening to port: ${port}`);
})