var express = require('express');
var router = express.Router();
const zonesapi = require('../controller/zones');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getzones', zonesapi.getzones);
router.post('/addzones', zonesapi.newzones);

router.get('/zoneids', zonesapi.zoneids);
router.post('/delete-zone', zonesapi.deletezones);

module.exports = router;