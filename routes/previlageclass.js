var express = require('express');
var router = express.Router();
const previlageclass = require('../controller/previlageclass');
// const authMiddleware = require('../middleware/authcheck.js');

/* GET home page. */
router.get('/getclass', previlageclass.getclass);
router.post('/addprevilageclass', previlageclass.addprevilageclass);

router.get('/classnames', previlageclass.classnames);

module.exports = router;