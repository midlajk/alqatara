var express = require('express');
var router = express.Router();
const reportclass = require('../controller/report');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/customerreport', reportclass.customerreport);
router.get('/creditreport', reportclass.creditreport);
router.get('/truckreport', reportclass.truckreport);



////////////api call 
router.get('/getsalesmanreport', reportclass.getsalesmanreport);

router.get('/getcutomerreport', reportclass.getcustomerreport);

router.get('/getruckreport', reportclass.gettruckreport);

router.get('/getcreditreport', reportclass.getcreditreport);

module.exports = router;