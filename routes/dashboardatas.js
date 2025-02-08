var express = require('express');
var router = express.Router();
const dashboardatas = require('../controller/dashboardatas');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/dashboardatas', dashboardatas.getdatas);
router.get('/sales-data', dashboardatas.gettotalsaleschart);
router.get('/getOrdersCount', dashboardatas.getOrdersCount);



module.exports = router;