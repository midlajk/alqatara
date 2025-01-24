
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Zone = mongoose.model('Zone')
const Route = mongoose.model('Route')
const Customer = mongoose.model('Customer')
const CitySchema = mongoose.model('CitySchema')

exports.getcities = async (req, res) => {
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
        CitySchema.find(query).skip(skip).limit(limit), // Fetch paginated data
        CitySchema.countDocuments(), // Total records count
        CitySchema.countDocuments(query) // Filtered records count
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
    exports.newcity = async (req, res) => {
 
      try {
        const city = new CitySchema(req.body);
        await city.save();
        res.redirect('/cities');
    } catch (error) {
        res.status(400).send({ error: error.message });
      }
 
  };

  exports.citynames = async (req, res) => {
    try {
      const cities = await CitySchema.find({}, { city: 1}); // Fetch only required fields
      res.json(cities);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching routes');
    }

    

};