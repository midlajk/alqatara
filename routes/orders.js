var express = require('express');
var router = express.Router();
const ordersapi = require('../controller/orders');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getorders', ordersapi.getorders);
router.post('/orders/neworder', ordersapi.neworder);

router.get('/editorder/:id', ordersapi.editorderpage);

router.post('/updateorder', ordersapi.updateOrder);
router.get('/orderhistory/:id', ordersapi.orderhistory);
router.get('/getorderhistorydata', ordersapi.orderhistorydata);
router.post('/delete-order', ordersapi.deleteorder);
router.post('/updateOrderStatus', ordersapi.updateOrderStatus);
router.post('/add-payment', ordersapi.addpayments);

////apuis
router.get('/assignedorders', ordersapi.assignedorders);
router.get('/deliveredorders', ordersapi.deliveredorders);
router.post('/deliveryorderapi', ordersapi.deliveryorderapi);
router.get('/creditorders', ordersapi.creditorders);
router.get('/orderdetails/:id', ordersapi.orderdetails);
router.post('/updatecreditorder/', ordersapi.updatecreditorder);

module.exports = router;