var express = require('express');
var router = express.Router();
const utilitiesApis = require('../controller/utilities');
// const authMiddleware = require('../middleware/authcheck.js');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');

/* GET home page. */
router.get('/gettrucks',apiprev.Getapiprev, utilitiesApis.gettrucks);
router.post('/addtrucks',WritePrivilage, utilitiesApis.addtrucks);
router.get('/gettrucknames',apiprev.Getapiprev, utilitiesApis.gettruckname);
router.get('/truckids',apiprev.Getapiprev, utilitiesApis.truckids);
router.get('/editutilities/:id',authMiddleware, utilitiesApis.editutilitiespage);
router.post('/updateTruck',WritePrivilage, utilitiesApis.updateTruck);
router.post('/closeTruckStock',apiprev.Postapiprev, utilitiesApis.closeTruckStock);



router.get('/truckhistory/:id',authMiddleware, utilitiesApis.truckhistorypage);
router.get('/gettruchhistory', utilitiesApis.gettruckhistory);


///apis 
router.get('/truckdetails', utilitiesApis.truckdetails);
router.post('/updatetruckapi', utilitiesApis.updateapi);


module.exports = router;