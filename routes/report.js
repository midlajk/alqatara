var express = require('express');
var router = express.Router();
const reportclass = require('../controller/report');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');
const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/customerreport',setCustomHeader('reports'),authMiddleware, reportclass.customerreport);
router.get('/creditreport',setCustomHeader('reports'),authMiddleware, reportclass.creditreport);
router.get('/truckreport',setCustomHeader('reports'),authMiddleware, reportclass.truckreport);

router.get('/individualsalesmanreport/:id', setCustomHeader('wallet'),authMiddleware, function(req, res, next) {
    console.log(req.params)
    res.render('reports/individualsalesmanreport', { title: 'Al Qattara' ,route:'Reports',sub :'Salesman Report of '+req.params.id});
  });


router.get('/commissionreport', setCustomHeader('wallet'),authMiddleware,reportclass.commissionreport )
////////////api call 
router.get('/getsalesmanreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.getsalesmanreport);

router.get('/getcutomerreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.getcustomerreport);

router.get('/getruckreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.gettruckreport);

router.get('/getcreditreport',setCustomHeader('reports'),apiprev.Getapiprev, reportclass.getcreditreport);

///download  
router.get('/getsalesmanreportxl',setCustomHeader('reports'),authMiddleware, reportclass.getsalesmanreport);
router.get('/getruckreportexcel',setCustomHeader('reports'),authMiddleware, reportclass.gettruckreport);
router.get('/getcutomerreporttxl',setCustomHeader('reports'),authMiddleware, reportclass.getcustomerreport);


module.exports = router;