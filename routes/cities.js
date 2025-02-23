var express = require('express');
var router = express.Router();
const cityapi = require('../controller/cities');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getcities', cityapi.getcities);
router.post('/addcity', cityapi.newcity);
router.get('/citynames', cityapi.citynames);
router.post('/delete-city', cityapi.deletecities);
router.post('/update-city', cityapi.updatecity);


module.exports = router;