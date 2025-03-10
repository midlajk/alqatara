
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck');
const TruckHistory = mongoose.model('TruckHistory')

const createError = require('http-errors');

exports.gettrucks = async (req, res) => {
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
    exports.addtrucks = async (req, res,next) => {
    try {
      const { truckId, city, maxStock5Gallon, maxStock200ml, assignedRoutes } = req.body;
      const existingTruck = await Truck.findOne({ id: truckId });
      if(existingTruck || !truckId){
        return next(createError(400, 'Truck ID already exists. Please update the existing truck or choose a new ID.'));
      }
      const newTruck = new Truck({
        id: truckId,
        city,
        stockOf5galBottles: parseInt(maxStock5Gallon, 10),
        stockOf200mlBottles: parseInt(maxStock200ml, 10),
        remaining200mlBottles :parseInt(maxStock200ml, 10),
        remaining5galBottles :parseInt(maxStock5Gallon, 10),
        routeId: assignedRoutes
      });
  
      await newTruck.save();
      res.redirect('/utilities?customKey=utilities');
    } catch (err) {
      return next(createError(400, err));

    }
  };


  exports.gettruckname = async (req, res) => {
    const searchQuery = req.query.search || "";
    const selectedCity = req.query.city || ""; // Get city filter from query
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
        res.status(500).send("Error fetching trucks");


    }
};

  
exports.truckids = async (req, res) => {
  try {
      const { q } = req.query; // Get search term

      let query = q ? { id: { $regex: q, $options: "i" } } : {}; // Search if 'q' exists

      const trucks = await Truck.find(query, { id: 1 }).limit(10); // Limit to 10 results

      res.json(trucks);
  } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching trucks");
  }
};


exports.editutilitiespage = async (req, res) => {

  const id = req.params.id
  const truck = await Truck.findById(id)
  res.render('utilities/updatetruck',  { title: 'Al Qattara',route:'Utilities',sub :'Update Truck',truck:truck });


  

};

exports.updateTruck = async (req, res) => {
  try {
      const { truckId, city, maxStock5Gallon, maxStock200ml, assignedRoutes,salesmanId,assistants } = req.body;

      // Find the truck by ID and update it
      const truck = await Truck.findOne({ id: truckId });

      if (!truck) {
          return res.status(404).json({ success: false, message: "Truck not found!" });
      }
      await Truck.updateMany(
        {
            $or: [
                { salesmanId: salesmanId },
                { assistants: assistants }
            ],
            id: { $ne: truckId } // Exclude the current truck
        },
        [
            {
                $set: {
                    salesmanId: { $cond: [{ $eq: ["$salesmanId", salesmanId] }, "", "$salesmanId"] },
                    assistants: { $cond: [{ $eq: ["$assistants", assistants] }, "", "$assistants"] }
                }
            }
        ]
    );
      const updatedTruck = await Truck.findOneAndUpdate(
          { id: truckId }, // Find by truck ID
          {
              city,
              stockOf5galBottles: parseInt(maxStock5Gallon, 10),
              stockOf200mlBottles: parseInt(maxStock200ml, 10),
              remaining200mlBottles: parseInt(maxStock200ml, 10) - parseInt(truck.delivered200mlBottles || 0),
              remaining5galBottles: parseInt(maxStock5Gallon, 10) - parseInt(truck.delivered5galBottles || 0),
              routeId: assignedRoutes,
              updatedAt: new Date(),
              salesmanId,
              assistants
          },
          { new: true, upsert: false } // Return updated document, don't create a new one
      );
      if (!updatedTruck) {
          return res.status(404).send('Truck not found / Failed to update ');
      }

      res.redirect('/utilities?customKey=utilities'); // Redirect after successful update
  } catch (err) {
      console.error('Error updating truck:', err);
      res.status(500).send('Failed to update truck.');
  }
};


exports.closeTruckStock = async (req, res) => {
  try {
    const { truckId } = req.body;

    // Fetch the truck details
    const truck = await Truck.findOne({ id: truckId });

    if (!truck) {
        return res.status(404).json({ success: false, message: "Truck not found!" });
    }

    // Create truck history entry
    const truckHistory = new TruckHistory({
        truckCreatedAt: truck.createdAt,
        truckUpdatedAt: truck.updatedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        truckId: truck.id,
        salesmanId: truck.salesmanId,
        damaged5galBottles: truck.damaged5galBottles,
        delivered200mlBottles: truck.delivered200mlBottles,
        delivered5galBottles: truck.delivered5galBottles,
        remaining200mlBottles: truck.remaining200mlBottles,
        remaining5galBottles: truck.remaining5galBottles,
        stockOf200mlBottles: truck.stockOf200mlBottles,
        stockOf5galBottles: truck.stockOf5galBottles,
        assistants: truck.assistants,
        routeId: truck.routeId,
        updatedBottleType: "BOTH" // Adjust logic as needed
    });

    // Save to TruckHistory collection
    await truckHistory.save();

    // Reset stock values while setting current stock with remaining stock
    
    truck.stockOf200mlBottles = truck.remaining200mlBottles;
    truck.stockOf5galBottles = truck.remaining5galBottles-truck.damaged5galBottles;
    truck.damaged5galBottles = 0;
    truck.delivered200mlBottles = 0;
    truck.delivered5galBottles = 0;
    truck.remaining200mlBottles = 0;
    truck.remaining5galBottles = 0;

    // Update the truck in the database
    await truck.save();

    res.json({ success: true, message: "Stock closed, history saved, and stock reset!" });

} catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
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


///apis 

exports.truckdetails = async (req, res) => {
  
  const { user } = req.query;
  try {
    const truckDetails = await Truck.findOne({ salesmanId: user });
    if (!truckDetails) {
      return res.status(404).json({ message: "No truck assigned to this user." });
    }
    return res.json(truckDetails);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }

};



// exports.updateapi = async (req, res) => {
//   try {
//     const { truckId, damagedBottles } = req.body;

//     // Find the truck by ID
//     const truck = await Truck.findOne({ id: truckId });

//     if (!truck) {
//       return res.status(404).json({ message: "Truck not found" }); // Use 404 for not found
//     }

//     // Update the truck
//     const updatedTruck = await Truck.findOneAndUpdate(
//       { id: truckId },
//       { damaged5galBottles: damagedBottles },
//       { new: true, upsert: false } // Return updated document, don't create a new one
//     );

//     if (!updatedTruck) {
//       return res.status(500).json({ message: "Failed to update truck" });
//     }

//     // Success response
//     res.json({ success: true, updatedTruck });

//   } catch (err) {
//     console.error('Error updating truck:', err);
//     res.status(500).json({ message: "Internal server error", error: err.message });
//   }
// };

exports.updateapi = async (req, res) => {
  try {
    const { truckId, damagedBottles, assistantId } = req.body;

    // Find the truck by ID
    const truck = await Truck.findOne({ id: truckId });

    if (!truck) {
      return res.status(404).json({ message: "Truck not found" }); // Use 404 for not found
    }

    // Create an update object dynamically
    let updateData = {};
    if (damagedBottles !== undefined) {
      updateData.damaged5galBottles = damagedBottles;
    }
    if (assistantId !== undefined) {
      updateData.assistants = assistantId;
    }

    // If no valid update data is provided, return an error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Update the truck
    const updatedTruck = await Truck.findOneAndUpdate(
      { id: truckId },
      { $set: updateData },
      { new: true, upsert: false } // Return updated document, don't create a new one
    );

    if (!updatedTruck) {
      return res.status(500).json({ message: "Failed to update truck" });
    }

    // Success response
    res.json({ success: true, updatedTruck });

  } catch (err) {
    console.error("Error updating truck:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
