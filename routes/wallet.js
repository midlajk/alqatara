var express = require('express');
var router = express.Router();
const walletclass = require('../controller/wallet');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getrecharges', walletclass.getrecharges);

module.exports = router;