
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { sessions } = require('./model/db'); // Explicitly import sessions
const Previlagemiddle  = require('./middleware/previlage');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const utilitiesRouter = require('./routes/utilities');
const ordersapi = require('./routes/orders');
const customerapi = require('./routes/customers');
const zoneapi = require('./routes/zones');
const routeapi = require('./routes/routes');
const salesmanapi = require('./routes/salesman');
const employeeapi = require('./routes/employees');
const previlageapis = require('./routes/previlageclass');
const cities = require('./routes/cities');
const dashboard = require('./routes/dashboardatas');
const report = require('./routes/report');
const wallet = require('./routes/wallet');
const inventory = require('./routes/inventory');
const moneymanagement = require('./routes/cashier');
const offers = require('./routes/offers');

const cors = require("cors");


const app = express();
app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (must come before routes)
app.use(sessions);
app.use((req, res, next) => {
  
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    res.locals.city = req.session.city;
    //added resptype to true 
  }  else {
    res.locals.user = null; // Ensures `user` is always defined
  }
  next();
});

app.use('/login', (req, res, next) => {
  res.locals.readonlyAccess = []; // Ensure readonlyAccess is always set
  next();
});

// **Apply Auth Middleware to All Other Routes**
app.use(Previlagemiddle);

// Routes
app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', utilitiesRouter);
app.use('/', ordersapi);
app.use('/', customerapi);
app.use('/', zoneapi);
app.use('/', routeapi);
app.use('/', salesmanapi);
app.use('/', employeeapi);
app.use('/', previlageapis);
app.use('/', cities);
app.use('/', dashboard);
app.use('/', report);
app.use('/', wallet);
app.use('/', inventory);
app.use('/', moneymanagement);
app.use('/', offers);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 400);
  res.render('error');
});

module.exports = app;
