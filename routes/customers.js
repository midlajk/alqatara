var express = require('express');
var router = express.Router();
const customerapi = require('../controller/customers');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getcustomers', customerapi.getcustomer);
router.post('/addCustomer', customerapi.newcustomer);


module.exports = router;