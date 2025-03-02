var express = require('express');
var router = express.Router();
const employeesapi = require('../controller/employees');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getemployees',setCustomHeader('masters'),apiprev.Getapiprev, employeesapi.getemployees);
router.post('/addemployees',setCustomHeader('masters'),apiprev.Getapiprev,WritePrivilage, employeesapi.newemployee);


module.exports = router;