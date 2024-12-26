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
  res.render('utilities/addtruck', { title: 'Express',route:'dashboard' });
});

router.get('/orders', function(req, res, next) {
  res.render('orders/orders', { title: 'Express',route:'orders' });
});
router.get('/orders/neworder', function(req, res, next) {
  res.render('orders/neworder', { title: 'Express',route:'orders' });
});

router.get('/customers', function(req, res, next) {
  res.render('customers/customers', { title: 'Express',route:'customers' });
});
router.get('/customers/newcustomer', function(req, res, next) {
  res.render('customers/newcustomer', { title: 'Express',route:'customers' });
});


router.get('/reports', function(req, res, next) {
  res.render('customers/customers', { title: 'Express' ,route:'reports'});
});
module.exports = router;
