
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Zone = mongoose.model('Zone')
const Route = mongoose.model('Route')
const createError = require('http-errors');

const Customer = mongoose.model('Customer')
exports.getzones = async (req, res) => {
  try {
      const { start, length, draw, search } = req.query; // Extract DataTables parameters
      const searchQuery = search?.value || ''; // Search value
      const limit = parseInt(length, 10) || 10; // Number of records per page
      const skip = parseInt(start, 10) || 0; // Offset

      let routeFilter = {}; // Default: No city filter

      // If session.city exists and is NOT "All", filter routes by city
      if (req.session.city && req.session.city !== "All") {
          const cityRoutes = await Route.find({ city: req.session.city }, { id: 1 }); // Fetch route IDs
          const routeIds = cityRoutes.map(route => route.id); // Extract route IDs
          routeFilter = { routeId: { $in: routeIds } }; // Filter zones by these routes
      }

      // Build search query
      const searchFilter = searchQuery
          ? { $or: [{ id: { $regex: searchQuery, $options: 'i' } }, { routeId: { $regex: searchQuery, $options: 'i' } }] }
          : {};

      // Combine filters
      const query = { ...routeFilter, ...searchFilter };

      // Get filtered data and total count
      const [filteredZones, totalRecords, totalFiltered] = await Promise.all([
          Zone.find(query).sort({ _id: -1 }).skip(skip).limit(limit), // Fetch paginated data
          Zone.countDocuments(), // Total records count
          Zone.countDocuments(query) // Filtered records count
      ]);

      // Respond with DataTables-compatible JSON
      res.json({
          draw: parseInt(draw, 10) || 1, // Pass draw counter
          recordsTotal: totalRecords, // Total records in database
          recordsFiltered: totalFiltered, // Total records after filtering
          docs: filteredZones // Data for the current page
      });
  } catch (err) {
      console.error('Error fetching zones:', err);
      res.status(500).json({ error: 'Failed to fetch zones' });
  }
};

//   app.post('/addtruck', async (req, res) => {
  exports.newzones = async (req, res, next) => { 
    try {
        const { id, routeId } = req.body;

        // Check if the Zone ID already exists
        const existingZone = await Zone.findOne({ id });
        if (existingZone) {
            return next(createError(400, 'Zone ID already exists. Please use a unique ID.'));
        }

        // Create and save the new zone
        const newZone = new Zone({
            id,
            routeId,
            creationDate: new Date(),
            updatedAt: new Date(),
        });

        await newZone.save();
        res.redirect('/zones'); // Redirect to zones page

    } catch (error) {
        return next(createError(400, error));
    }
};

exports.zoneids = async (req, res) => {
  try {
    const { truckid, route } = req.query;

    let filter = {}; // Initialize empty filter

    // if (truckid) {
    //   const truck = await Truck.findOne({ id: truckid }); // Find truck by id

    //   if (truck && truck.routeId) {
    //     // filter.routeId = truck.routeId; // Use truck's routeId
    //   }
    // }

    // If route is explicitly passed in query, override or set it
    if (route) {
      filter.routeId = route;
    }
    console.log(filter)

    // Now filter zones by routeId
    const zones = await Zone.find(filter);
    console.log(zones)

    res.json(zones);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching zones');
  }
};




exports.deletezones = async (req, res) => {
  try {
    const { id } = req.body;
    const deletedZone = await Zone.findByIdAndDelete(id);
    if (!deletedZone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    console.error("Error deleting zone:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};