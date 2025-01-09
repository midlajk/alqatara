var express = require('express');
var router = express.Router();
const authMiddleware = require('../middleware/auth');

/* GET home page. */
router.get('/',authMiddleware, function(req, res, next) {
  res.render('index', { title: 'Express',route:'Dashboard',sub :'Default'});
});

router.get('/utilities',authMiddleware, function(req, res, next) {
  res.render('utilities/utilities', { title: 'Express' ,route:'Utilities',sub :'Manage Utilities'});
});
router.get('/utilities/addtruck',authMiddleware, function(req, res, next) {
  res.render('utilities/addtruck', { title: 'Express',route:'Utilities',sub :'New Utilities' });
});

router.get('/orders',authMiddleware, function(req, res, next) {
  res.render('order/orders', { title: 'Express',route:'Orders',sub :'Manage Orders' });
});
router.get('/orders/neworder',authMiddleware, function(req, res, next) {
  res.render('order/neworder', { title: 'Express',route:'Orders',sub :'New Order' });
});

router.get('/customers',authMiddleware, function(req, res, next) {
  res.render('customers/customers', { title: 'Express',route:'Customer',sub :'Manage Customer' });
});
router.get('/customers/newcustomer',authMiddleware, function(req, res, next) {
  res.render('customers/newcustomer', { title: 'Express',route:'Customer',sub :'New Customer' });
});


router.get('/zones',authMiddleware, function(req, res, next) {
  res.render('zones/zones', { title: 'Express',route:'Zones',sub :'Manage Zones' });
});
router.get('/zones/addzone',authMiddleware, function(req, res, next) {
  res.render('zones/addzones', { title: 'Express',route:'Zones',sub :'New Zone' });
});



router.get('/routes',authMiddleware, function(req, res, next) {
  res.render('route/routes', { title: 'Express',route:'Routes',sub :'Manage Routes' });
});
router.get('/routes/addroute',authMiddleware, function(req, res, next) {
  res.render('route/newroutes', { title: 'Express',route:'Routes',sub :'New Route' });
});

router.get('/reports',authMiddleware, function(req, res, next) {
  res.render('customers/customers', { title: 'Express' ,route:'Reports',sub :'Manage Reports'});
});

router.get('/login', function(req, res, next) {
  res.render('login/login.ejs', { title: 'Express' ,route:'reports'});
});
module.exports = router;
