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


///apis 
router.get('/truckdetails', utilitiesApis.truckdetails);
router.post('/updatetruckapi', utilitiesApis.updateapi);


module.exports = router;