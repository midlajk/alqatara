var express = require('express');
var router = express.Router();
const ordersapi = require('../controller/orders');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getorders', ordersapi.getorders);
router.post('/orders/neworder', ordersapi.neworder);
router.get('/assignedorders', ordersapi.assignedorders);
router.get('/editorder/:id', ordersapi.editorderpage);

router.post('/updateorder', ordersapi.updateOrder);
router.get('/orderhistory/:id', ordersapi.orderhistory);
router.get('/getorderhistorydata', ordersapi.orderhistorydata);

module.exports = router;