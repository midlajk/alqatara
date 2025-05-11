const moneymanagement = require('./offers');

var express = require('express');

var router = express.Router();
const walletclass = require('../controller/wallet');
const authMiddleware = require('../middleware/auth');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
/* GET home page. */
const WritePrivilage = require('../middleware/previlagewrite');

router.get('/getrecharges',setCustomHeader('wallet'),apiprev.Getapiprev, walletclass.getrecharges);
router.get('/recharges/:rechargeId/coupons',setCustomHeader('wallet'),apiprev.Getapiprev, walletclass.getCouponsByRecharge);
router.get('/downloadcoupon/:downloadid',setCustomHeader('wallet'),apiprev.Getapiprev, walletclass.downloadcoupon);
router.get('/getrecharges',setCustomHeader('wallet'),apiprev.Getapiprev, walletclass.getrecharges);


router.get('/addwalletrecharge', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    res.render('wallet/walletrecharge', { title: 'Al Qattara' ,route:'Wallet',sub :'Recharge Wallet'});
  });

router.get('/customer-coupons/:customerId/:truckId/:product',setCustomHeader('wallet'),apiprev.Getapiprev, walletclass.customercoupons);


module.exports = router;