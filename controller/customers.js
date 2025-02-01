
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
        Customer.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
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


  exports.customerids = async (req, res) => {
    console.log('sdsds')
    try {
        const search = req.query.search || ""; // Search input from frontend
        const customerId = req.query.customerId || ""; // If customerId is provided
        const customerName = req.query.customerName || ""; // If customerName is provided
        console.log(customerId,customerName)

        let query = {};

        if (customerId) {
            query.id = customerId; // Find customer by UID
        } else if (customerName) {
            query.name = { $regex: new RegExp(customerName, "i") }; // Find by name
        } else if (search) {
            query = {
                $or: [
                    { name: { $regex: new RegExp(search, "i") } }, // Match customer name
                    { id: { $regex: new RegExp(search, "i") } }, // Match UID
                ],
            };
        }

        const customers = await Customer.find(query).limit(10);
        res.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};