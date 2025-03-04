var express = require('express');
var router = express.Router();
const zonesapi = require('../controller/zones');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getzones',setCustomHeader('zones'),apiprev.Getapiprev, zonesapi.getzones);
router.post('/addzones',setCustomHeader('zones'),WritePrivilage, zonesapi.newzones);

router.post('/delete-zone',setCustomHeader('zones'),apiprev.Postapiprev, zonesapi.deletezones);
//mobile apis

router.get('/zoneids', zonesapi.zoneids);

module.exports = router;