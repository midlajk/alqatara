var express = require('express');
var router = express.Router();
const walletclass = require('../controller/wallet');
const authMiddleware = require('../middleware/auth');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
/* GET home page. */
const WritePrivilage = require('../middleware/previlagewrite');


router.get('/offers', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    res.render('offers/offer', { title: 'Al Qattara' ,route:'Offers',sub :'Recharge Wallet'});
  });
  router.get('/newoffer', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    res.render('offers/newoffer', { title: 'Al Qattara' ,route:'Offers',sub :'Recharge Wallet'});
  });
  router.get('/salesmancommission', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    res.render('offers/salesmancommission', { title: 'Al Qattara' ,route:'Offers',sub :'Recharge Wallet'});
  });

  router.get('/newcommission', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    res.render('offers/newcommission', { title: 'Al Qattara' ,route:'Offers',sub :'Recharge Wallet'});
  });

router.post('/addwalletmoney',setCustomHeader('wallet'),WritePrivilage, walletclass.addwalletmoney);


module.exports = router;