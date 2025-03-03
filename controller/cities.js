
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Zone = mongoose.model('Zone')
const Route = mongoose.model('Route')
const Customer = mongoose.model('Customer')
const CitySchema = mongoose.model('CitySchema')
const createError = require('http-errors');

exports.getcities = async (req, res) => {
    try {
      const { start, length, draw, search } = req.query; // Extract DataTables parameters
      const searchQuery = search && search.value ? search.value : ''; // Search value
      const limit = parseInt(length, 10) || 10; // Number of records per page
      const skip = parseInt(start, 10) || 0; // Offset
      
      // Build query with optional search
      let query = {};

      // Apply search filter if exists
      if (searchQuery) {
          query.$or = [
              { id: { $regex: searchQuery, $options: 'i' } },
              { city: { $regex: searchQuery, $options: 'i' } }
          ];
      }

      // Apply city filter if session city exists and is not "All"
      if (req.session.city && req.session.city !== 'All') {
          query.city = { $regex: `^${req.session.city}$`, $options: 'i' }; // Case-insensitive match for exact city name
      }
      // Get filtered data and total count
      const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
        CitySchema.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
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
  exports.newcity = async (req, res, next) => { 
    try {
        const { id, city, mobileNumber, supervisorMobileNumber } = req.body;

        // Check if a city with the same ID or Name already exists
        const existingCity = await CitySchema.findOne({ 
            $or: [{ id }, { city }]  // Check by ID or City Name
        });

        if (existingCity) {
            return next(createError(400, 'City ID or City Name already exists. Please use a unique ID and Name.'));
        }

        // Create and save the new city
        const newCity = new CitySchema({
            id,
            city,
            mobileNumber,
            supervisorMobileNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newCity.save();
        res.redirect('/cities'); // Redirect to cities page

    } catch (error) {
              return next(createError(400, error));
      
    }
};


  exports.citynames = async (req, res) => {
    try {
      const cityFilter = req.session.city; // Get city from session
  
      let query = {};
      if (cityFilter && cityFilter.toLowerCase() !== "all") {
        query = { city: cityFilter }; // Filter for the specific city
      }
  
      const cities = await CitySchema.find(query, { city: 1 }); // Fetch only required fields
      res.json(cities);
      
    } catch (err) {
      console.error("Error fetching cities:", err);
      res.status(500).send("Error fetching cities");
    }
  };
  


exports.deletecities = async (req, res) => {
  try {
    const { id } = req.body;
    const deletedCity = await CitySchema.findByIdAndDelete(id);
    if (!deletedCity) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.updatecity = async (req, res) => {
  try {
    if (req.body.city) {
      req.session.city = req.body.city; // Store selected city in session
      res.json({ success: true, city: req.body.city });
  } else {
      res.status(400).json({ success: false, message: "No city provided" });
  }
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};