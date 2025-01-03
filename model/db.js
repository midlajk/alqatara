// const mongoose = require("mongoose");
// const session = require('express-session');
// const MongoDBStore = require('connect-mongodb-session')(session);
// const MongoStore = require('connect-mongo');

// // Connect to the database
// const url = `mongodb://127.0.0.1:27017/alQattara`;

// // Connect to the database using Mongoose
// mongoose.connect(url, {  useNewUrlParser: true,
//   useUnifiedTopology: true,});

// // Get the default connection
// const db = mongoose.connection;

// // Handle database connection errors
// db.on('error', (err) => {
//     console.log('MongoDB connection error:', err);
// });
// db.once('connected', () => {
//   console.log('MongoDB connection established successfully');
// });
// const sessions = session({
//     secret: 'alqatara@123', // Replace with a secure secret
//     resave: false,
//     saveUninitialized: true,
//     store: MongoStore.create({
//       mongoUrl: url,
//       collectionName: 'sessions',
//     }),
//     cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
//   })
// module.exports = sessions ;
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const url = "mongodb://127.0.0.1:27017/alQattara";

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (err) => console.error("MongoDB connection error:", err));
db.once("connected", () => console.log("MongoDB connected successfully"));

const sessions = session({
  secret: "alqatara@123",
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: url,
    collectionName: "sessions",
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
});
require('./database'); 
module.exports = { sessions, mongoose };

// Include your Mongoose models (e.g., clientsmodal) here
// Replace with the correct path to your model file