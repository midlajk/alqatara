var express = require('express');
var router = express.Router();
const cityapi = require('../controller/cities');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getcities',setCustomHeader('cities'),apiprev.Getapiprev, cityapi.getcities);
router.post('/addcity',setCustomHeader('cities'),WritePrivilage, cityapi.newcity);
router.get('/citynames',setCustomHeader('cities'),apiprev.Getapiprev, cityapi.citynames);
router.post('/delete-city',setCustomHeader('cities'),apiprev.Postapiprev, cityapi.deletecities);
router.post('/update-city',setCustomHeader('cities'),apiprev.Postapiprev, cityapi.updatecity);


module.exports = router;