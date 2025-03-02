var express = require('express');
var router = express.Router();
const salesmanapiapi = require('../controller/salesman');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getsalesman',setCustomHeader('salesman'),apiprev.Getapiprev, salesmanapiapi.getsalesman);
router.post('/addsalesman',setCustomHeader('salesman'),WritePrivilage, salesmanapiapi.newsalesman);
router.get('/salesmanids',setCustomHeader('salesman'),apiprev.Getapiprev, salesmanapiapi.salesmanids);



////Mobile app 

router.post('/salesmanlogin', salesmanapiapi.salesmanlogin);


module.exports = router;