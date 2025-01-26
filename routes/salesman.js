var express = require('express');
var router = express.Router();
const salesmanapiapi = require('../controller/salesman');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getsalesman', salesmanapiapi.getsalesman);
router.post('/addsalesman', salesmanapiapi.newsalesman);


module.exports = router;