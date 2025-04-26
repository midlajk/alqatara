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
router.get('/inventorymanagement', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
  res.render('utilities/inventory', { title: 'Al Qattara' ,route:'Utilities',sub :'Manage Inventory'});
});
router.get('/addnewproduct', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
    res.render('utilities/newproduct', { title: 'Al Qattara' ,route:'Utilities',sub :'New Product'});
  });

  router.get('/updateinventory', setCustomHeader('utilities'),authMiddleware, function(req, res, next) {
    res.render('utilities/updateintorystock', { title: 'Al Qattara' ,route:'Utilities',sub :'Update Stock'});
  });
// router.get('/inventorymanagement', setCustomHeader('utilities'), authMiddleware, inventory.egtinventorydetails);
router.get('/stockhistory/:id', setCustomHeader('utilities'),authMiddleware, async function(req, res, next) {
  const id = req.params.id
  res.render('utilities/stockhistory',{ title: 'Al Qattara',route:'Utilities',sub :'Stock History ',id:id });
});
router.post('/updatestock', setCustomHeader('utilities'),authMiddleware, inventory.updatestockinventory);
router.post('/addnewproduct', setCustomHeader('utilities'),authMiddleware, inventory.addOrUpdateProduct);
router.post('/delete-product',setCustomHeader('utilities'),apiprev.Postapiprev, inventory.deleteproduct);


router.get('/getinventory', inventory.getProducts);
router.get('/productids', inventory.getProductnames);
router.get('/getStockhistory', inventory.getStockhistory);
router.get('/stockhistory-stats', inventory.getsumstockhistory);
router.get('/getproductsnames', inventory.getproductsnames);
router.get('/exportStockHistory', inventory.exportStockHistory);



module.exports = router;