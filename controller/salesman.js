
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')

const Salesman = mongoose.model('Salesman')

exports.getsalesman = async (req, res) => {

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
        Salesman.find(query).skip(skip).limit(limit), // Fetch paginated data
        Salesman.countDocuments(), // Total records count
        Salesman.countDocuments(query) // Filtered records count
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
    exports.newsalesman = async (req, res) => {
 
      try {
        const salesman = new Salesman(req.body);
        await salesman.save();
        res.redirect('/salesman');
    } catch (error) {
        res.status(400).send({ error: error.message });
      }
 
  };

    
  exports.salesmanids = async (req, res) => {
    try {
      const salesmans = await Salesman.find({}, { id: 1}); // Fetch only required fields
      console.log(salesmans)
      res.json(salesmans);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching routes');
    }

    

};