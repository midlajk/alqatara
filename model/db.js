const mongoose = require("mongoose");
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// Connect to the database
const url = `mongodb://127.0.0.1:27017/alQattara`;

// Connect to the database using Mongoose
mongoose.connect(url, {  useNewUrlParser: true,
  useUnifiedTopology: true,});

// Get the default connection
const db = mongoose.connection;

// Handle database connection errors
db.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});
db.once('connected', () => {
  console.log('MongoDB connection established successfully');
});

// Include your Mongoose models (e.g., clientsmodal) here
require('./database'); // Replace with the correct path to your model file