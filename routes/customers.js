var express = require('express');
var router = express.Router();
const customerapi = require('../controller/customers');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getcustomers',setCustomHeader('customers'),apiprev.Getapiprev, customerapi.getcustomer);
router.post('/addCustomer',setCustomHeader('customers'),WritePrivilage, customerapi.newcustomer);




router.delete('/deletecustomer/:id',setCustomHeader('customers'),apiprev.Getapiprev, customerapi.deletecustomer);

router.get('/customers/deletedcustomers',setCustomHeader('customers'),authMiddleware, customerapi.deletecustomersscreen);
router.get('/getdeletedcustomers',setCustomHeader('customers'),apiprev.Getapiprev, customerapi.getdeletedcustomers);

//////////Views


router.get('/creditpayment/:id', setCustomHeader('customers'),authMiddleware, function(req, res, next) {
    res.render('customers/creditpayment', { title: 'Al Qattara',route:'Customer',sub :'Payment History',id:req.params.id });
  });
  
router.get('/customerorderhistory/:id', setCustomHeader('customers'),authMiddleware, function(req, res, next) {
  res.render('customers/orderhistory', { title: 'Al Qattara',route:'Customer',sub :'Order History',id:req.params.id });
});

router.get('/customerassethistory/:id', setCustomHeader('customers'),authMiddleware, function(req, res, next) {
  res.render('customers/assethistory', { title: 'Al Qattara',route:'Customer',sub :'Asset History',id:req.params.id });
});


//mobile api 
router.get('/customersee', customerapi.customerids);
router.post('/newcustomerapi', customerapi.newcustomerapi);
router.get('/customerdetails/:id', customerapi.customerdetails);
router.post('/customerupdate', customerapi.updatecustomer);
router.get('/dailycustomers/:routeId', customerapi.dailycustomer);
router.get('/collectionsum', customerapi.getwalletandassetcollection);
router.post('/generateotplink', customerapi.generateotplink);





module.exports = router;