var express = require('express');
var router = express.Router();
const utilitiesApis = require('../controller/utilities');
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
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck');
const setCustomHeader = require('../middleware/customkeyadd');

/* GET home page. */
router.get('/gettrucks', setCustomHeader('utilities'), apiprev.Getapiprev, utilitiesApis.gettrucks);
router.post('/addtrucks', setCustomHeader('utilities'),WritePrivilage, utilitiesApis.addtrucks);
router.get('/gettrucknames', setCustomHeader('utilities'),apiprev.Getapiprev, utilitiesApis.gettruckname);
router.get('/truckids', setCustomHeader('utilities'),apiprev.Getapiprev, utilitiesApis.truckids);
router.get('/editutilities/:id', setCustomHeader('utilities'),authMiddleware, utilitiesApis.editutilitiespage);
router.post('/updateTruck', setCustomHeader('utilities'),WritePrivilage, utilitiesApis.updateTruck);
router.post('/closeTruckStock', setCustomHeader('utilities'),apiprev.Postapiprev, utilitiesApis.closeTruckStock);



router.get('/truckhistory/:id', setCustomHeader('utilities'),authMiddleware, utilitiesApis.truckhistorypage);
router.get('/gettruchhistory', setCustomHeader('utilities'),apiprev.Getapiprev, utilitiesApis.gettruckhistory);
router.get('/printtruckdetail/:id', setCustomHeader('utilities'),apiprev.Getapiprev, utilitiesApis.printTruckstock);

//views //////

router.get('/updatetruckstock/:id', setCustomHeader('utilities'),authMiddleware, async function(req, res, next) {
    const id = req.params.id
    const truck = await Truck.findById(id)
    res.render('utilities/updatestock',{ title: 'Al Qattara',route:'Utilities',sub :'Update Truck Stock',truck:truck });
  });
  router.get('/gettruckstocks/:id', setCustomHeader('utilities'),authMiddleware, utilitiesApis.TruckStrocks);
  router.post('/updatetruckstock', setCustomHeader('utilities'),authMiddleware, utilitiesApis.UpdateTruckStrocks);

  router.get('/getProductHistorySummary', setCustomHeader('utilities'),authMiddleware, utilitiesApis.getProductHistorySummary);
  router.get('/getalltruckProductHistorySummary', setCustomHeader('utilities'),authMiddleware, utilitiesApis.getalltruckProductHistorySummary);


///apis 
router.get('/truckdetails', utilitiesApis.truckdetails);
router.post('/updatetruckapi', utilitiesApis.updateapi);


module.exports = router;