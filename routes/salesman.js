var express = require('express');
var router = express.Router();
const salesmanapiapi = require('../controller/salesman');
// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

require('../model/database')
const mongoose = require('mongoose');
const Salesman = mongoose.model('Salesman')

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getsalesman',setCustomHeader('salesman'),apiprev.Getapiprev, salesmanapiapi.getsalesman);
router.post('/addsalesman',setCustomHeader('salesman'),WritePrivilage, salesmanapiapi.newsalesman);
router.get('/salesmanids', salesmanapiapi.salesmanids);

router.get('/individualsalesmanreport/:id', setCustomHeader('wallet'),authMiddleware, async function(req, res, next) {
      const salesman = await Salesman.findOne({id:req.params.id})

    res.render('salesman/individualsalesmanreport', { title: 'Al Qattara' ,route:'Salesman',sub :'Salesman Report of '+req.params.id,salesmanId:req.params.id});
  });

router.get('/api/salesman/report/:salesmanId',setCustomHeader('salesman'),apiprev.Getapiprev, salesmanapiapi.salesmanreport);

router.get('/updatesalesman/:id', setCustomHeader('salesman'),authMiddleware, async function(req, res, next) {
   
    const salesman = await Salesman.findById(req.params.id)

    res.render('salesman/newsalesman', { title: 'Al Qattara' ,route:'Salesman',sub :'Update Salesman',salesman:salesman});
  });

  router.post('/updatesalesman/:id', setCustomHeader('salesman'),WritePrivilage, salesmanapiapi.updatesalesman);


////Mobile app 

router.post('/salesmanlogin', salesmanapiapi.salesmanlogin);
router.post('/salesmanlogintoken', salesmanapiapi.salesmanlogintoken);

// router.get('/apisalesmanids', salesmanapiapi.salesmanids);


module.exports = router;