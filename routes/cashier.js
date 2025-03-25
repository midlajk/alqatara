var express = require('express');
var router = express.Router();
const inventory = require('../controller/inventory');
// const authMiddleware = require('../middleware/authcheck.js');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');

// function setCustomHeader(customValue) {
//     return function (req, res, next) {
//         req.query.customKey = customValue;
//         req.body.customKey = customValue;
//         next();
//     };
// }
const setCustomHeader = require('../middleware/customkeyadd');

/* GET home page. */
router.get('/cashier', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('moneymanagement/cashier', { title: 'Al Qattara' ,route:'Cashier',sub :'Money Management'});
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