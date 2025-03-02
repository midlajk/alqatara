var express = require('express');
var router = express.Router();
const dashboardatas = require('../controller/dashboardatas');
const apiprev = require('../middleware/apiprevilage');
const setCustomHeader = require('../middleware/customkeyadd');

/* GET home page. */
router.get('/dashboardatas', setCustomHeader('dashboard'),apiprev.Getapiprev, dashboardatas.getdatas);
router.get('/sales-data', setCustomHeader('dashboard'),apiprev.Getapiprev, dashboardatas.gettotalsaleschart);
router.get('/getOrdersCount', setCustomHeader('dashboard'),apiprev.Getapiprev, dashboardatas.getOrdersCount);



module.exports = router;