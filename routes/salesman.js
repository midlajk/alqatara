var express = require('express');
var router = express.Router();
const customersalesmanapiapi = require('../controller/salesman');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getsalesman', customersalesmanapiapi.getsalesman);
router.post('/addsalesman', customersalesmanapiapi.newsalesman);


module.exports = router;