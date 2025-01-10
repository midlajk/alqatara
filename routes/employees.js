var express = require('express');
var router = express.Router();
const employeesapi = require('../controller/employees');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getemployees', employeesapi.getemployees);
router.post('/addemployees', employeesapi.newemployee);


module.exports = router;