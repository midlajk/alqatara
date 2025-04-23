var express = require('express');
var router = express.Router();
const offerclass = require('../controller/offers');
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

router.post('/addoffer',setCustomHeader('wallet'),WritePrivilage, offerclass.addOffer);
router.get('/offerlist',setCustomHeader('wallet'),WritePrivilage, offerclass.getAllOffers);
router.post('/delete-offer',setCustomHeader('wallet'),WritePrivilage, offerclass.deleteOffer);
router.get('/offercodes',setCustomHeader('wallet'),WritePrivilage, offerclass.offerlist);

router.get('/commissionschemes',  offerclass.commissionnames)

router.post('/addcommission',setCustomHeader('wallet'),WritePrivilage, offerclass.addcommission);
router.get('/commissionlist',setCustomHeader('wallet'),WritePrivilage, offerclass.getAllCommission);
router.post('/deletecommission',setCustomHeader('wallet'),WritePrivilage, offerclass.deleteCommission);


module.exports = router;