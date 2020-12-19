//required modules
const mongoose = require("mongoose");
const Campground = require("../models/campground");
const { descriptors, places } = require("./seedHelpers");
const cities = require("./cities");

//connecting to mongodb
mongoose.connect("mongodb://localhost:27017/yelp-camp", {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//verify connection to mongodb
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Database Connected!")
});



//pick a random item from an array
const itemPicker = array => array[Math.floor(Math.random() * array.length)];


//seed DB with 50 items
const seedDB = async () => {
  //removes existing data
  await Campground.deleteMany()
    .then(() => {
      console.log("DB has been tilted");
    })
    .catch(err => {
      console.log("Tilting failed");
      console.log(err);
    });

  //creats new items and saves them to the database
  for (let i = 0; i < 300; i++) {
    const randomNum = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20 + 10);
    const camp = new Campground({
      location: `${cities[randomNum].city}, ${cities[randomNum].state}`,
      title: `${itemPicker(descriptors)} ${itemPicker(places)}`,
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      price,
      author: "5fdbe48d202c73379859191d", //user id from fakeuser route
      geometry: {
        type: "Point",
        coordinates: [
          cities[randomNum].longitude,
          cities[randomNum].latitude,
        ]
      },
      images: [
        {
          url: 'https://res.cloudinary.com/nguyenmichaelm/image/upload/v1608101215/YelpCamp/zmcl3zjrkgzteniurheq.webp',
          filename: 'YelpCamp/zmcl3zjrkgzteniurheq'
        },
        {
          url: 'https://res.cloudinary.com/nguyenmichaelm/image/upload/v1608101215/YelpCamp/ulnnlqef8ohxsb80vofo.webp',
          filename: 'YelpCamp/ulnnlqef8ohxsb80vofo'
        },
        {
          url: 'https://res.cloudinary.com/nguyenmichaelm/image/upload/v1608101215/YelpCamp/skbokeovtctd5h2ob1fz.webp',
          filename: 'YelpCamp/skbokeovtctd5h2ob1fz'
        },
        {
          url: 'https://res.cloudinary.com/nguyenmichaelm/image/upload/v1608101215/YelpCamp/x2u8tpievo1molo8arrk.webp',
          filename: 'YelpCamp/x2u8tpievo1molo8arrk'
        }
      ]
    })
    await camp.save();
  }
}


//calls function and closes data base conncetion when done
seedDB()
  .then(() => {
    console.log("If user DB has been deleted, hit '/fakeUser' route to validate Author")
    mongoose.connection.close();
  })
  .catch(err => {
    console.log("Seeding Failed");
    console.log(err);
  }
  );