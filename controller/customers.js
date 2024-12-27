
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')

const Customer = mongoose.model('Customer')

exports.getcustomer = async (req, res) => {
    console.log('Processing DataTables request...');
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
      const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
        Customer.find(query).skip(skip).limit(limit), // Fetch paginated data
        Customer.countDocuments(), // Total records count
        Customer.countDocuments(query) // Filtered records count
      ]);
  
      // Respond with DataTables-compatible JSON
      res.json({
        draw: parseInt(draw, 10) || 1, // Pass draw counter
        recordsTotal: totalRecords, // Total records in database
        recordsFiltered: totalFiltered, // Total records after filtering
        docs: filteredTrucks // Data for the current page
      });
    } catch (err) {
      console.error('Error fetching trucks:', err);
      res.status(500).json({ error: 'Failed to fetch trucks' });
    }
  };
  

//   app.post('/addtruck', async (req, res) => {
    exports.newcustomer = async (req, res) => {
 
      try {
        const cutomer = new Customer(req.body);
        await cutomer.save();
        res.redirect('/customers');
    } catch (error) {
        res.status(400).send({ error: error.message });
      }
 
  };