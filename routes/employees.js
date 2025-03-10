var express = require('express');
var router = express.Router();
const employeesapi = require('../controller/employees');

require('../model/database')
const mongoose = require('mongoose');
const Employee = mongoose.model('Employee')

// const authMiddleware = require('../middleware/authcheck.js');
const setCustomHeader = require('../middleware/customkeyadd');

const apiprev = require('../middleware/apiprevilage');
const WritePrivilage = require('../middleware/previlagewrite');
const authMiddleware = require('../middleware/auth');
/* GET home page. */
router.get('/getemployees',setCustomHeader('masters'),apiprev.Getapiprev, employeesapi.getemployees);
router.post('/addemployees',setCustomHeader('masters'),apiprev.Getapiprev,WritePrivilage, employeesapi.newemployee);
router.get('/editmaster/:id', setCustomHeader('masters'), authMiddleware, async function(req, res, next) {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        // Handle the case where the employee is not found
        return res.status(404).send('Employee not found');
      }
      res.render('master/editemployee', {
        title: 'Al Qattara',
        route: 'Masters',
        sub: 'Update Employee',
        employee: employee
      });
    } catch (error) {
      // Pass any errors to the next middleware (e.g., error handler)
      next(error);
    }
  });


  router.post('/updateemployee/:id',setCustomHeader('masters'),apiprev.Getapiprev,WritePrivilage, employeesapi.editemployee);

  

module.exports = router;