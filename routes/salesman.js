var express = require('express');
var router = express.Router();
const salesmanapiapi = require('../controller/salesman');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getsalesman', salesmanapiapi.getsalesman);
router.post('/addsalesman', salesmanapiapi.newsalesman);
router.get('/salesmanids', salesmanapiapi.salesmanids);



////Mobile app 

router.post('/salesmanlogin', salesmanapiapi.salesmanlogin);


module.exports = router;