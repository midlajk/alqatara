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


router.get('/addwalletrecharge', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    res.render('wallet/walletrecharge', { title: 'Al Qattara' ,route:'Wallet',sub :'Recharge Wallet'});
  });

router.post('/addwalletmoney',setCustomHeader('wallet'),WritePrivilage, walletclass.addwalletmoney);


module.exports = router;