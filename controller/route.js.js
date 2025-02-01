
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Zone = mongoose.model('Zone')
const Route = mongoose.model('Route')

const Customer = mongoose.model('Customer')

exports.getroutes = async (req, res) => {
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
        Route.find(query).skip(skip).limit(limit), // Fetch paginated data
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
    exports.newroutes = async (req, res) => {
      console.log(req.body)
 
      try {
        const routes = new Route(req.body);
        await routes.save();
        res.redirect('/routes');
    } catch (error) {
        res.status(400).send({ error: error.message });
      }
 
  };

  exports.routeids = async (req, res) => {
    try {
      const routes = await Route.find({}, { id: 1}); // Fetch only required fields
      console.log(routes)
      res.json(routes);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching routes');
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