var express = require('express');
var router = express.Router();
const customerapi = require('../controller/customers');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getcustomers', customerapi.getcustomer);
router.post('/addCustomer', customerapi.newcustomer);

router.get('/customersee', customerapi.customerids);



router.delete('/deletecustomer/:id', customerapi.deletecustomer);

router.get('/customers/deletedcustomers', customerapi.deletecustomersscreen);
router.get('/getdeletedcustomers', customerapi.getdeletedcustomers);


//mobile api 
router.post('/newcustomerapi', customerapi.newcustomerapi);
router.get('/customerdetails/:id', customerapi.customerdetails);
router.post('/customerupdate', customerapi.updatecustomer);
router.get('/dailycustomers/:routeId', customerapi.dailycustomer);




module.exports = router;