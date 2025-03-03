
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Zone = mongoose.model('Zone')
const Route = mongoose.model('Route')
const createError = require('http-errors');

const Customer = mongoose.model('Customer')

exports.getroutes = async (req, res) => {
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
        Route.find(query).sort({ _id: -1 }).skip(skip).limit(limit), // Fetch paginated data
        Route.countDocuments(), // Total records count
        Route.countDocuments(query) // Filtered records count
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
  exports.newroutes = async (req, res,next) => { 
    try {
      const { id, city, mobileNumber, supervisorMobileNumber } = req.body;
  
      // Check if the ID already exists
      const existingRoute = await Route.findOne({ id });
      if (existingRoute) {
          return next(createError(400, 'Route ID already exists. Please use a unique ID.'));
      }
  
      // Create and save the new route
      const newRoute = new Route({
        id,
        city,
        mobileNumber,
        supervisorMobileNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      await newRoute.save();
      res.redirect('/routes'); // Redirect to routes page
  
    } catch (error) {
            return next(createError(400, error));
    
    }
  };
  

  exports.routeids = async (req, res) => {
    try {
      const cityFilter = req.session.city; // Get city from session
  
      let query = {};
      if (cityFilter && cityFilter.toLowerCase() !== "all") {
        query = { city: cityFilter }; // Filter routes only from the same city
      }
  
      const routes = await Route.find(query, { id: 1 }); // Fetch only required fields
      res.json(routes);
      
    } catch (err) {
      console.error("Error fetching routes:", err);
      res.status(500).send("Error fetching routes");
    }
  };
  


exports.deleteroutes = async (req, res) => {
  try {
    const { id } = req.body;
    const deletedRoute = await Route.findByIdAndDelete(id);
    if (!deletedRoute) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }

};