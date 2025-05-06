var express = require('express');
var router = express.Router();
const ordersapi = require('../controller/orders');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getorders',setCustomHeader('orders'),apiprev.Getapiprev, ordersapi.getorders);
router.post('/orders/neworder',setCustomHeader('orders'),WritePrivilage, ordersapi.neworder);

router.get('/editorder/:id',setCustomHeader('orders'),authMiddleware, ordersapi.editorderpage);
router.get('/vieworder/:orderId',  ordersapi.vieworder);
router.get('/getorderdeliverysummery',setCustomHeader('orders'),apiprev.Getapiprev, ordersapi.getorderdeliverysummery);




router.post('/updateorder',setCustomHeader('orders'),WritePrivilage, ordersapi.updateOrder);
router.get('/orderhistory/:id',setCustomHeader('orders'),authMiddleware, ordersapi.orderhistory);
router.get('/getorderhistorydata',setCustomHeader('orders'),apiprev.Getapiprev, ordersapi.orderhistorydata);
router.post('/delete-order',setCustomHeader('orders'),apiprev.Postapiprev, ordersapi.deleteorder);
router.post('/updateOrderStatus',setCustomHeader('orders'),apiprev.Postapiprev, ordersapi.updateOrderStatus);
router.post('/add-payment',setCustomHeader('orders'),apiprev.Postapiprev, ordersapi.addpayments);
router.get('/orderdashboard-stats',setCustomHeader('orders'),apiprev.Getapiprev, ordersapi.getDashboardStats);

////apuis
router.get('/assignedorders', ordersapi.assignedorders);
router.get('/deliveredorders', ordersapi.deliveredorders);
router.post('/deliveryorderapi', ordersapi.deliveryorderapi);
router.get('/creditorders', ordersapi.creditorders);
router.get('/orderdetails/:id', ordersapi.orderdetails);
router.post('/updatecreditorder/', ordersapi.updatecreditorder);
router.get('/getsalesum', ordersapi.getsalesum);

module.exports = router;