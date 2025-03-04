var express = require('express');
var router = express.Router();
const routeapi = require('../controller/route.js');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getroutes',setCustomHeader('routes'),apiprev.Getapiprev, routeapi.getroutes);
router.post('/addRoute',setCustomHeader('routes'),WritePrivilage, routeapi.newroutes);
router.post('/delete-route',setCustomHeader('routes'),apiprev.Postapiprev, routeapi.deleteroutes);
//mobile apis
router.get('/routeids', routeapi.routeids);

module.exports = router;