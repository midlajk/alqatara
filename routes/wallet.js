var express = require('express');
var router = express.Router();
const walletclass = require('../controller/wallet');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
/* GET home page. */
router.get('/getrecharges',setCustomHeader('wallet'),apiprev.Getapiprev, walletclass.getrecharges);

module.exports = router;