// require('./model/db');

// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// const session = require('express-session');
// const abc = require('./model/db');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
// var utilitiesRouter = require('./routes/utilities');
// var ordersapi = require('./routes/orders');
// var customerapi = require('./routes/customers');
// var zoneapi = require('./routes/zones');
// var routeapi = require('./routes/routes');

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// // app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'));

// app.use('/', indexRouter);
// app.use('/', usersRouter);
// app.use('/', utilitiesRouter);
// app.use('/', ordersapi);
// app.use('/', customerapi);
// app.use('/', zoneapi);
// app.use('/', routeapi);
// app.use(abc.sessions);
// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;
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
    
    //added resptype to true 
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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
