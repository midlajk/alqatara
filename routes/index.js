var express = require('express');
var router = express.Router();
const authMiddleware = require('../middleware/auth');
const setCustomHeader = require('../middleware/customkeyadd');

/* GET home page. */
router.get('/dashboard', setCustomHeader('dashboard'),authMiddleware, function(req, res, next) {
  res.render('index', { title: 'Al Qattara',route:'Dashboard',sub :'Default' ,selectedCity: req.session.city || 'All' });
});

router.get('/utilities', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('utilities/utilities', { title: 'Al Qattara' ,route:'Utilities',sub :'Manage Utilities'});
});
router.get('/utilities/addtruck', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('utilities/addtruck', { title: 'Al Qattara',route:'Utilities',sub :'New Utilities' });
});

router.get('/orders', setCustomHeader('orders'),authMiddleware, function(req, res, next) {
  res.render('order/orders', { title: 'Al Qattara',route:'Orders',sub :'Manage Orders' });
});
router.get('/orders/neworder', setCustomHeader('orders'),authMiddleware, function(req, res, next) {
  res.render('order/neworder', { title: 'Al Qattara',route:'Orders',sub :'New Order' });
});

router.get('/customers', setCustomHeader('customers'),authMiddleware, function(req, res, next) {
  res.render('customers/customers', { title: 'Al Qattara',route:'Customer',sub :'Manage Customer' });
});
router.get('/customers/newcustomer', setCustomHeader('customers'),authMiddleware, function(req, res, next) {
  res.render('customers/newcustomer', { title: 'Al Qattara',route:'Customer',sub :'New Customer' });
});


router.get('/zones', setCustomHeader('zones'),authMiddleware, function(req, res, next) {
  res.render('zones/zones', { title: 'Al Qattara',route:'Zones',sub :'Manage Zones' });
});
router.get('/zones/addzone', setCustomHeader('zones'),authMiddleware, function(req, res, next) {
  res.render('zones/addzones', { title: 'Al Qattara',route:'Zones',sub :'New Zone' });
});



router.get('/routes', setCustomHeader('routes'),authMiddleware, function(req, res, next) {
  res.render('route/routes', { title: 'Al Qattara',route:'Routes',sub :'Manage Routes' });
});
router.get('/routes/addroute', setCustomHeader('routes'),authMiddleware, function(req, res, next) {
  res.render('route/newroutes', { title: 'Al Qattara',route:'Routes',sub :'New Route' });
});

router.get('/report', setCustomHeader('reports'),authMiddleware, function(req, res, next) {
  res.render('reports/salespersonreports', { title: 'Al Qattara' ,route:'Reports',sub :'Sales Reports'});
});

router.get('/login', function(req, res, next) {
  res.render('login/login.ejs', { title: 'Al Qattara' ,route:'reports'});
});

router.get('/manageprevilages', setCustomHeader('privileges'),authMiddleware, function(req, res, next) {
  res.render('previliages/manageprevilage', { title: 'Al Qattara' ,route:'Previlages',sub :'Manage Previlages'});
});
router.get('/createprevilages', setCustomHeader('privileges'),authMiddleware, function(req, res, next) {
  res.render('previliages/createprevilage', { title: 'Al Qattara' ,route:'Previlages',sub :'Create Previlages'});
});
router.get('/masters', setCustomHeader('masters'),authMiddleware, function(req, res, next) {
  res.render('master/masters', { title: 'Al Qattara' ,route:'Masters',sub :'Manage Masters'});
});

router.get('/addnewemployee', setCustomHeader('masters'),authMiddleware, function(req, res, next) {
  res.render('master/newemployee', { title: 'Al Qattara' ,route:'Masters',sub :'Register Employee'});
});

router.get('/wallet', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
  res.render('wallet/wallet', { title: 'Al Qattara' ,route:'Wallet',sub :'Manage Wallet'});
});

router.get('/salesman', setCustomHeader('salesman'),authMiddleware, function(req, res, next) {
  res.render('salesman/salesmans', { title: 'Al Qattara' ,route:'Salesman',sub :'Manage Salesman'});
});

router.get('/addnewsalesman', setCustomHeader('salesman'),authMiddleware, function(req, res, next) {
  res.render('salesman/newsalesman', { title: 'Al Qattara' ,route:'Salesman',sub :'Register Salesman'});
});

router.get('/cities', setCustomHeader('cities'),authMiddleware, function(req, res, next) {
  res.render('city/cities', { title: 'Al Qattara',route:'Cities',sub :'Manage City' });
});
router.get('/city/addnewcity', setCustomHeader('cities'),authMiddleware, function(req, res, next) {
  res.render('city/newcity', { title: 'Al Qattara',route:'Cities',sub :'New City' });
});

module.exports = router;
