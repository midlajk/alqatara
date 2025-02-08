
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck');
const TruckHistory = mongoose.model('TruckHistory')


exports.gettrucks = async (req, res) => {
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
        Truck.find(query).sort({ _id: -1 }).skip(skip).limit(limit), // Fetch paginated data
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
      const existingTruck = await Truck.findOne({ id: truckId });
      if(existingTruck){
        return res.status(500).send('Failed to add truck go back and try updating the data and give new truck id .');
      }
      const newTruck = new Truck({
        id: truckId,
        city,
        stockOf5galBottles: parseInt(maxStock5Gallon, 10),
        stockOf200mlBottles: parseInt(maxStock200ml, 10),
        routeId: assignedRoutes
      });
  
      await newTruck.save();
      res.redirect('/utilities');
    } catch (err) {
      console.error('Error adding truck:', err);
      res.status(500).send('Failed to add truck.');
    }
  };


  exports.gettruckname = async (req, res) => {
    const searchQuery = req.query.search || "";
    const selectedCity = req.query.city || ""; // Get city filter from query
    console.log(searchQuery,selectedCity)

    try {
        let query = {
            id: { $regex: searchQuery, $options: "i" },
        };

        // Apply city filter only if a city is selected (excluding "All")
        if (selectedCity && selectedCity !== "All") {
            query.city = selectedCity;
        }

        const trucks = await Truck.find(query).limit(50); // Limit results for performance
        res.json(trucks);
    } catch (error) {
        console.error("Error fetching trucks:", error);
        res.status(500).json({ error: "Failed to fetch trucks" });
    }
};

  
  exports.truckids = async (req, res) => {
    console.log('hehe')
    try {
      const routes = await Truck.find({}, { id: 1}); // Fetch only required fields
      res.json(routes);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching routes');
    }

    

};

exports.editutilitiespage = async (req, res) => {

  const id = req.params.id
  const truck = await Truck.findById(id)
  console.log(truck)
  res.render('utilities/updatetruck',  { title: 'Al Qattara',route:'Utilities',sub :'Update Truck',truck:truck });


  

};

exports.updateTruck = async (req, res) => {
  try {
      const { truckId, city, maxStock5Gallon, maxStock200ml, assignedRoutes,salesmanId,assistants } = req.body;
      console.log(req.body)

      // Find the truck by ID and update it
      const updatedTruck = await Truck.findOneAndUpdate(
          { id: truckId }, // Find by truck ID
          {
              city,
              stockOf5galBottles: parseInt(maxStock5Gallon, 10),
              stockOf200mlBottles: parseInt(maxStock200ml, 10),
              routeId: assignedRoutes,
              updatedAt: new Date(),
              salesmanId:salesmanId,
              assistants:assistants // Update timestamp

          },
          { new: true, upsert: false } // Return updated document, don't create new one
      );

      if (!updatedTruck) {
          return res.status(404).send('Truck not found');
      }

      res.redirect('/utilities'); // Redirect after successful update
  } catch (err) {
      console.error('Error updating truck:', err);
      res.status(500).send('Failed to update truck.');
  }
};

exports.truckhistorypage = async (req, res) => {
  

  const id = req.params.id
  // const truck = await TruckHistory.find({truckId:id})
  // console.log(truck)
  res.render('utilities/truckhistory', { title: 'Al Qattara',route:'Utilities',sub :'Truck History',id:id });


  

};

exports.gettruckhistory = async (req, res) => {
  try {
    const { start, length, draw, search } = req.query; // Extract DataTables parameters
    const searchQuery = search && search.value ? search.value : ''; // Search value
    const limit = parseInt(length, 10) || 10; // Number of records per page
    const skip = parseInt(start, 10) || 0; // Offset
    
    // Build query with optional search
    const query = {
      truckId: req.query.id, // Filter by truckId
      ...(searchQuery
        ? {
            $or: [
              { salesmanId: { $regex: searchQuery, $options: 'i' } },
              { routeId: { $regex: searchQuery, $options: 'i' } }
            ]
          }
        : {})
    };
    // Get filtered data and total count
    const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
      TruckHistory.find(query).sort({ id: -1 }).skip(skip).limit(limit), // Fetch paginated data
      TruckHistory.countDocuments({ truckId: req.query.id }), // Total records count
      TruckHistory.countDocuments(query) // Filtered records count
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