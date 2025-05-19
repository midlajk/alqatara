var express = require('express');
var router = express.Router();
const cashier = require('../controller/cashier');
// const authMiddleware = require('../middleware/authcheck.js');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');


const setCustomHeader = require('../middleware/customkeyadd');
router.get('/salesman-collections',setCustomHeader('routes'),apiprev.Getapiprev, cashier.getsalesmanpayment);
router.get('/customer-credits',setCustomHeader('routes'),apiprev.Getapiprev, cashier.getcustomerpayment);
router.post('/collect-salesman-payment',setCustomHeader('routes'),WritePrivilage, cashier.collectpayments);
router.get('/api/cashier-collections',setCustomHeader('routes'),apiprev.Getapiprev, cashier.cashcollection);
router.get('/api/cashier-collections/export',setCustomHeader('routes'),apiprev.Getapiprev, cashier.cashcollectionexport);
router.get('/api/cashier-collections/stats',setCustomHeader('routes'),apiprev.Getapiprev, cashier.cashcollectionstatus);
router.get('/salesman-collections-summary', setCustomHeader('routes'),apiprev.Getapiprev, cashier.getSalesmanCollectionsSummary);
router.get('/customer-credits-summary', setCustomHeader('routes'),apiprev.Getapiprev, cashier.getCustomerCreditsSummary);

/* GET home page. */
router.get('/cashier', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('moneymanagement/cashier', { title: 'Al Qattara' ,route:'Cashier',sub :'Money Management'});
});
router.get('/customer-pending', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('moneymanagement/customer-pending', { title: 'Al Qattara' ,route:'Cashier',sub :'Money Management'});
});
router.get('/customercollection', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('moneymanagement/customercollection', { title: 'Al Qattara' ,route:'Cashier',sub :'Customer Credit Collection'});
});
router.get('/collectedpayments', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('moneymanagement/collectedpayments', { title: 'Al Qattara' ,route:'Cashier',sub :'Collected Payments'});
});
// router.get('/addnewproduct', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
//     res.render('utilities/newproduct', { title: 'Al Qattara' ,route:'Utilities',sub :'New Product'});
//   });
// router.get('/inventorymanagement', setCustomHeader('utilities'), authMiddleware, inventory.egtinventorydetails);


module.exports = router;