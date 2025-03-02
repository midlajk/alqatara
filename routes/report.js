var express = require('express');
var router = express.Router();
const reportclass = require('../controller/report');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/customerreport',setCustomHeader('reports'),authMiddleware, reportclass.customerreport);
router.get('/creditreport',setCustomHeader('reports'),authMiddleware, reportclass.creditreport);
router.get('/truckreport',setCustomHeader('reports'),authMiddleware, reportclass.truckreport);



////////////api call 
router.get('/getsalesmanreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.getsalesmanreport);

router.get('/getcutomerreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.getcustomerreport);

router.get('/getruckreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.gettruckreport);

router.get('/getcreditreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.getcreditreport);

module.exports = router;