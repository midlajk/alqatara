var express = require('express');
var router = express.Router();
const previlageclass = require('../controller/previlageclass');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getclass',setCustomHeader('privileges'),apiprev.Getapiprev, previlageclass.getclass);
router.post('/addprevilageclass',setCustomHeader('privileges'),WritePrivilage, previlageclass.addprevilageclass);

router.get('/classnames',setCustomHeader('privileges'),apiprev.Getapiprev, previlageclass.classnames);

module.exports = router;