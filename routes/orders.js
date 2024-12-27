var express = require('express');
var router = express.Router();
const ordersapi = require('../controller/orders');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getorders', ordersapi.getorders);
router.post('/orders/neworder', ordersapi.neworder);


module.exports = router;