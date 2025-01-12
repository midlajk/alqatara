var express = require('express');
var router = express.Router();
const utilitiesApis = require('../controller/utilities');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/gettrucks', utilitiesApis.gettrucks);
router.post('/addtrucks', utilitiesApis.addtrucks);
router.get('/gettrucknames', utilitiesApis.gettruckname);


module.exports = router;