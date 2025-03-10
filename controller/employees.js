
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')
const bcrypt = require('bcrypt');
const createError = require('http-errors');

const Employee = mongoose.model('Employee')

exports.getemployees = async (req, res) => {
    try {
      const { start, length, draw, search } = req.query; // Extract DataTables parameters
      const searchQuery = search && search.value ? search.value : ''; // Search value
      const limit = parseInt(length, 10) || 10; // Number of records per page
      const skip = parseInt(start, 10) || 0; // Offset
      
      // Build query with optional search
      const query = searchQuery
        ? { $or: [{ id: { $regex: searchQuery, $options: 'i' } }, { city: { $regex: searchQuery, $options: 'i' } }] }
        : {};
  
      // Get filtered data and total count
      const [filtereddata, totalRecords, totalFiltered] = await Promise.all([
        Employee.find(query).sort({ _id: -1 }).skip(skip).limit(limit), // Fetch paginated data
        Employee.countDocuments(), // Total records count
        Employee.countDocuments(query) // Filtered records count
      ]);
  
      // Respond with DataTables-compatible JSON
      res.json({
        draw: parseInt(draw, 10) || 1, // Pass draw counter
        recordsTotal: totalRecords, // Total records in database
        recordsFiltered: totalFiltered, // Total records after filtering
        docs: filtereddata // Data for the current page
      });
    } catch (err) {
      console.error('Error fetching trucks:', err);
      res.status(500).json({ error: 'Failed to fetch trucks' });
    }
  };
  

//   app.post('/addtruck', async (req, res) => {
  exports.newemployee = async (req, res) => {
    try {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash with salt rounds (10)
  
      // Create new employee with hashed password
      const employee = new Employee({
        name: req.body.name,
        password: hashedPassword, // Store hashed password
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        designation: req.body.designation
      });
  
      await employee.save();
      res.redirect('/masters');
    } catch (error) {
              return next(createError(400, error));
      
    }
  };


  exports.editemployee = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, password, email, mobileNumber, designation } = req.body;
  
      // Find the employee by ID
      const employee = await Employee.findById(id);
      if (!employee) {
        return res.status(404).send('Employee not found');
      }
  
      // Update fields
      employee.name = name;
      employee.email = email;
      employee.mobileNumber = mobileNumber;
      employee.designation = designation;
  
      // Hash the new password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        employee.password = hashedPassword;
      }
  
      // Save the updated employee
      await employee.save();
  
      res.redirect('/masters');
    } catch (error) {
      next(error);
    }
  }