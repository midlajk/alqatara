var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express',route:'dashboard' });
});

router.get('/utilities', function(req, res, next) {
  res.render('utilities/utilities', { title: 'Express' ,route:'utilities'});
});
router.get('/utilities/addtruck', function(req, res, next) {
  res.render('utilities/addtruck', { title: 'Express',route:'utilities' });
});

router.get('/orders', function(req, res, next) {
  res.render('order/orders', { title: 'Express',route:'orders' });
});
router.get('/orders/neworder', function(req, res, next) {
  res.render('order/neworder', { title: 'Express',route:'orders' });
});

router.get('/customers', function(req, res, next) {
  res.render('customers/customers', { title: 'Express',route:'customers' });
});
router.get('/customers/newcustomer', function(req, res, next) {
  res.render('customers/newcustomer', { title: 'Express',route:'customers' });
});


router.get('/zones', function(req, res, next) {
  res.render('zones/zones', { title: 'Express',route:'zones' });
});
router.get('/zones/addzone', function(req, res, next) {
  res.render('zones/addzones', { title: 'Express',route:'zones' });
});



router.get('/routes', function(req, res, next) {
  res.render('route/routes', { title: 'Express',route:'routes' });
});
router.get('/routes/addroute', function(req, res, next) {
  res.render('route/newroutes', { title: 'Express',route:'routes' });
});

router.get('/reports', function(req, res, next) {
  res.render('customers/customers', { title: 'Express' ,route:'reports'});
});
module.exports = router;
