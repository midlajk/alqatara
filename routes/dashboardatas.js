var express = require('express');
var router = express.Router();
const dashboardatas = require('../controller/dashboardatas');
const apiprev = require('../middleware/apiprevilage');

/* GET home page. */
router.get('/dashboardatas',apiprev.Getapiprev, dashboardatas.getdatas);
router.get('/sales-data',apiprev.Getapiprev, dashboardatas.gettotalsaleschart);
router.get('/getOrdersCount',apiprev.Getapiprev, dashboardatas.getOrdersCount);



module.exports = router;