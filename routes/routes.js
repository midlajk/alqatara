var express = require('express');
var router = express.Router();
const routeapi = require('../controller/route.js');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getroutes', routeapi.getroutes);
router.post('/addRoute', routeapi.newroutes);
router.get('/routeids', routeapi.routeids);
router.post('/delete-route', routeapi.deleteroutes);


module.exports = router;