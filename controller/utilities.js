
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')


exports.gettrucks = async (req, res) => {
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
        Truck.find(query).skip(skip).limit(limit), // Fetch paginated data
        Truck.countDocuments(), // Total records count
        Truck.countDocuments(query) // Filtered records count
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
    exports.addtrucks = async (req, res) => {
    try {
      const { truckId, city, maxStock5Gallon, maxStock200ml, assignedRoutes } = req.body;
      console.log(req.body)
  
      const newTruck = new Truck({
        id: truckId,
        city,
        stockOf5galBottles: parseInt(maxStock5Gallon, 10),
        stockOf200mlBottles: parseInt(maxStock200ml, 10),
        routeId: assignedRoutes
      });
  
      await newTruck.save();
      res.redirect('/getorders');
    } catch (err) {
      console.error('Error adding truck:', err);
      res.status(500).send('Failed to add truck.');
    }
  };


  exports.gettruckname =  async (req, res) => {
    const searchQuery = req.query.search || "";
    try {
      const trucks = await Truck.find({
        id: { $regex: searchQuery, $options: "i" },
      }).limit(50); // Limit results for performance
      res.json(trucks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trucks" });
    }
  };