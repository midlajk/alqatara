var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/utilities', function(req, res, next) {
  res.render('utilities/utilities', { title: 'Express' });
});
router.get('/utilities/addtruck', function(req, res, next) {
  res.render('utilities/addtruck', { title: 'Express' });
});

router.get('/orders', function(req, res, next) {
  res.render('orders/orders', { title: 'Express' });
});
router.get('/orders/neworder', function(req, res, next) {
  res.render('orders/neworder', { title: 'Express' });
});

router.get('/customers', function(req, res, next) {
  res.render('customers/customers', { title: 'Express' });
});
router.get('/customers/newcustomer', function(req, res, next) {
  res.render('customers/newcustomer', { title: 'Express' });
});


router.get('/reports', function(req, res, next) {
  res.render('customers/customers', { title: 'Express' });
});
module.exports = router;
