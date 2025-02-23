var express = require('express');
var router = express.Router();
const authMiddleware = require('../middleware/auth');

/* GET home page. */
router.get('/dashboard', function(req, res, next) {
  res.render('index', { title: 'Al Qattara',route:'Dashboard',sub :'Default' ,selectedCity: req.session.city || 'All' });
});

router.get('/utilities',authMiddleware, function(req, res, next) {
  res.render('utilities/utilities', { title: 'Al Qattara' ,route:'Utilities',sub :'Manage Utilities'});
});
router.get('/utilities/addtruck',authMiddleware, function(req, res, next) {
  res.render('utilities/addtruck', { title: 'Al Qattara',route:'Utilities',sub :'New Utilities' });
});

router.get('/orders',authMiddleware, function(req, res, next) {
  res.render('order/orders', { title: 'Al Qattara',route:'Orders',sub :'Manage Orders' });
});
router.get('/orders/neworder',authMiddleware, function(req, res, next) {
  res.render('order/neworder', { title: 'Al Qattara',route:'Orders',sub :'New Order' });
});

router.get('/customers',authMiddleware, function(req, res, next) {
  res.render('customers/customers', { title: 'Al Qattara',route:'Customer',sub :'Manage Customer' });
});
router.get('/customers/newcustomer',authMiddleware, function(req, res, next) {
  res.render('customers/newcustomer', { title: 'Al Qattara',route:'Customer',sub :'New Customer' });
});


router.get('/zones',authMiddleware, function(req, res, next) {
  res.render('zones/zones', { title: 'Al Qattara',route:'Zones',sub :'Manage Zones' });
});
router.get('/zones/addzone',authMiddleware, function(req, res, next) {
  res.render('zones/addzones', { title: 'Al Qattara',route:'Zones',sub :'New Zone' });
});



router.get('/routes',authMiddleware, function(req, res, next) {
  res.render('route/routes', { title: 'Al Qattara',route:'Routes',sub :'Manage Routes' });
});
router.get('/routes/addroute',authMiddleware, function(req, res, next) {
  res.render('route/newroutes', { title: 'Al Qattara',route:'Routes',sub :'New Route' });
});

router.get('/report',authMiddleware, function(req, res, next) {
  res.render('reports/salespersonreports', { title: 'Al Qattara' ,route:'Reports',sub :'Sales Reports'});
});

router.get('/login', function(req, res, next) {
  res.render('login/login.ejs', { title: 'Al Qattara' ,route:'reports'});
});

router.get('/manageprevilages',authMiddleware, function(req, res, next) {
  res.render('previliages/manageprevilage', { title: 'Al Qattara' ,route:'Previlages',sub :'Manage Previlages'});
});
router.get('/createprevilages',authMiddleware, function(req, res, next) {
  res.render('previliages/createprevilage', { title: 'Al Qattara' ,route:'Previlages',sub :'Create Previlages'});
});
router.get('/masters',authMiddleware, function(req, res, next) {
  res.render('master/masters', { title: 'Al Qattara' ,route:'Masters',sub :'Manage Masters'});
});

router.get('/addnewemployee',authMiddleware, function(req, res, next) {
  res.render('master/newemployee', { title: 'Al Qattara' ,route:'Masters',sub :'Register Employee'});
});

router.get('/wallet',authMiddleware, function(req, res, next) {
  res.render('wallet/wallet', { title: 'Al Qattara' ,route:'Wallet',sub :'Manage Wallet'});
});

router.get('/salesman',authMiddleware, function(req, res, next) {
  res.render('salesman/salesmans', { title: 'Al Qattara' ,route:'Salesman',sub :'Manage Salesman'});
});

router.get('/addnewsalesman',authMiddleware, function(req, res, next) {
  res.render('salesman/newsalesman', { title: 'Al Qattara' ,route:'Salesman',sub :'Register Salesman'});
});

router.get('/cities',authMiddleware, function(req, res, next) {
  console.log('here')
  res.render('city/cities', { title: 'Al Qattara',route:'Cities',sub :'Manage City' });
});
router.get('/city/addnewcity',authMiddleware, function(req, res, next) {
  res.render('city/newcity', { title: 'Al Qattara',route:'Cities',sub :'New City' });
});

module.exports = router;
