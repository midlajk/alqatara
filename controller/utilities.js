
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck');
const TruckHistory = mongoose.model('TruckHistory')
const Product = mongoose.model('Product');
const Stockdelivery = mongoose.model('Stockdelivery');

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




exports.truckhistorypage = async (req, res) => {
  

  const id = req.params.id
  // const truck = await TruckHistory.find({truckId:id})
  // console.log(truck)
  res.render('utilities/truckhistory', { title: 'Al Qattara',route:'Utilities',sub :'Truck History',id:id });


  

};

exports.gettruckhistory = async (req, res) => {
  try {
    const { start, length, draw, search, fromDate, toDate } = req.query;
    const searchQuery = search && search.value ? search.value : '';
    const limit = parseInt(length, 10) || 10;
    const skip = parseInt(start, 10) || 0;
    
    // Date handling
    const startDate = fromDate ? new Date(fromDate) : new Date(0); // Beginning of time if no date
    const endDate = toDate ? new Date(toDate) : new Date(); // Now if no date
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build query with all filters
    const query = {
      truckId: req.query.id,
      updatedAt: { $gte: startDate, $lte: endDate },
      ...(searchQuery ? {
        $or: [
          { salesmanId: { $regex: searchQuery, $options: 'i' } },
          { routeId: { $regex: searchQuery, $options: 'i' } }
        ]
      } : {})
    };

    const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
      TruckHistory.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      TruckHistory.countDocuments({ truckId: req.query.id }),
      TruckHistory.countDocuments(query)
    ]);

    res.json({
      draw: parseInt(draw, 10) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: totalFiltered,
      docs: filteredTrucks
    });
  } catch (err) {
    console.error('Error fetching trucks:', err);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
};




exports.TruckStrocks = async (req, res) => {
  try {
    const truck = await Truck.findOne({id: req.params.id});
    if (!truck) {
        return res.status(404).json({ 
            success: false, 
            error: "Truck not found" 
        });
    }
    res.json({ 
        success: true, 
        data: truck // Now returns a single truck object
    });
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error',
        message: error.message 
    });
  }
};

function getPreviousStock(truck, productName) {
  if (productName === '5galBottles') return truck.stockOf5galBottles;
  if (productName === '200mlBottles') return truck.stockOf200mlBottles;
  return 0;
}


exports.UpdateTruckStrocks = async (req, res) => {
  try {
    const { truckId, productName, actionType, itemStatus, quantity, city, doneby, productId } = req.body;
    
    // Validate input
    if (!truckId || !productName || !actionType || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid input data" 
      });
    }

    // Find truck - use findOne instead of find
    const truck = await Truck.findOne({ id: truckId });
    if (!truck) {
      return res.status(404).json({ success: false, error: "Truck not found" });
    }
    
    // Find product
    const product = await Product.findOne({ productid: productId });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: `Product ${productName} not found in inventory` 
      });
    }
    console.log('her2')

    // Get previous stock values
    const previousStock = product.currentStock || 0;
    const previousDamage = product.damagedStock || 0;
    const previousDiscard = product.discardedStock || 0;
    
    // Create new product detail
    const productDetail = {
      productid: productId,
      productname: productName,
      quantity: quantity,
      inwardoutward: actionType,
      time: new Date(),
      itemtype: itemStatus,
      doneby: doneby,
      city: city,
      previousStock: previousStock,
      previousDamage: previousDamage,
      previousDiscard: previousDiscard
    };
    
    // Initialize productDetails array if it doesn't exist
    if (!truck.productDetails) {
      truck.productDetails = [];
    }
    
    // Update truck's productDetails
    truck.productDetails.push(productDetail);
    
    // Update product inventory based on action
    if (actionType === 'outward') {
      product.currentStock -= quantity; // Remove from inventory

    } else {
      // For outward movement
      // product.currentStock += quantity; // Return to inventory
      
      if (itemStatus === 'Damaged') {
        product.damagedStock += quantity;
      } else{
        product.currentStock += quantity; // Return to inventory

      }
      // else if (itemStatus === 'Old') {
      //   product.discardedStock += quantity;
      // }
    }
    
    // Save both documents
    await Promise.all([
      truck.save(),
      product.save()
    ]);
    console.log(truck)
    res.json({ 
      success: true, 
      data: {
        truck: truck,
        product: product
      } 
    });
    
  } catch (error) {
    console.log('Error updating truck stock:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message 
    });
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
exports.closeTruckStock = async (req, res) => {

  try {
    const { truckId } = req.body;

    // 1. Find the truck document
    const truck = await Truck.findOne({ id: truckId })
    if (!truck) {
      return res.status(404).json({ success: false, message: "Truck not found" });
    }

    // 2. Create stock delivery record
    const stockDelivery = new Stockdelivery({
      truckId: truck.id,
      city: truck.city,
      date:new Date(),
      productDetails: truck.productDetails.map(detail => ({
        productid: detail.productid,
        productname: detail.productname,
        quantity: detail.quantity,
        inwardoutward: detail.inwardoutward,
        time: detail.time,
        itemtype: detail.itemtype,
        doneby: detail.doneby,
        city: detail.city,
        previousStock: detail.previousStock,
        previousDamage: detail.previousDamage,
        previousDiscard: detail.previousDiscard
      })),
      status: 'completed'
    });

    // 3. Create truck history record
    const truckHistory = new TruckHistory({
      truckId: truck.id,
      truckCreatedAt: truck.createdAt,
      truckUpdatedAt: truck.updatedAt,
      salesmanId: truck.salesmanId,

      assistants: truck.assistants.join(', '), // Convert array to string
      routeId: truck.routeId,
      productDetails: truck.productDetails.map(detail => ({
        ...detail.toObject(),
        delivered: detail.delivered
      }))
    });

    // 4. Clear truck's product details and reset counts
    truck.productDetails = [];
  
    truck.updatedAt = new Date();

    // 5. Save all changes in a transaction
    await Promise.all([
      stockDelivery.save(),
      truckHistory.save(),
      truck.save()
    ]);

    
    res.json({ 
      success: true,
      message: "Stock successfully closed and archived",
      data: {
        stockDeliveryId: stockDelivery._id,
        truckHistoryId: truckHistory._id
      }
    });

  } catch (error) {
    console.error("Error closing truck stock:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error closing stock",
      error: error.message 
    });
  } 
};



// Backend API endpoint
exports.getProductHistorySummary = async (req, res) => {
  try {
    const { truckId, fromDate, toDate } = req.query;
    
    // Convert dates to proper Date objects
    const startDate = fromDate ? new Date(fromDate) : new Date(0);
    const endDate = toDate ? new Date(toDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Aggregation pipeline with date filtering
    const productSummaries = await TruckHistory.aggregate([
      {
        $match: {
          truckId: truckId,
          updatedAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: {
            productId: "$productDetails.productid",
            productName: "$productDetails.productname"
          },
          totalLoaded: {
            $sum: {
              $cond: [
                { $eq: ["$productDetails.inwardoutward", "outward"] },
                "$productDetails.quantity",
                0
              ]
            }
          },
          totalDelivered: {
            $sum: "$productDetails.delivered"
          },
          totalReturned: {
            $sum: {
              $cond: [
                { $eq: ["$productDetails.inwardoutward", "inward"] },
                "$productDetails.quantity",
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id.productId",
          productName: "$_id.productName",
          totalLoaded: 1,
          totalDelivered: 1,
          totalReturned: 1
        }
      },
      { $sort: { productName: 1 } }
    ]);

    // Get all products to ensure we show all even if no activity
    const allProducts = await Product.find({}, 'productid name type');
    
    const mergedData = allProducts.map(product => {
      const summary = productSummaries.find(p => p.productId === product.productid) || {};
      return {
        productId: product.productid,
        productName: product.name,
        productType: product.type,
        totalLoaded: summary.totalLoaded || 0,
        totalDelivered: summary.totalDelivered || 0,
        totalReturned: summary.totalReturned || 0
      };
    });

    res.json({
      success: true,
      data: mergedData
    });

  } catch (err) {
    console.error('Error fetching product summary:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product summary'
    });
  }
};


exports.getalltruckProductHistorySummary = async (req, res) => {
  try {
    const { truckId, fromDate, toDate } = req.query;
    console.log(req.query)
    
    // Convert dates to proper Date objects
    const startDate = fromDate ? new Date(fromDate) : new Date(0); // Beginning of time if no date
    const endDate = toDate ? new Date(toDate) : new Date(); // Now if no date
    
    // Aggregation pipeline to calculate product summaries
    const productSummaries = await Truck.aggregate([
      // Match documents for the specific truck and date range
      
      // Unwind the productDetails array to process each product separately
      { $unwind: "$productDetails" },
      // Group by product and calculate sums
      {
        $group: {
          _id: {
            productId: "$productDetails.productid",
            productName: "$productDetails.productname"
          },
          totalLoaded: {
            $sum: {
              $cond: [
                  { $eq: ["$productDetails.inwardoutward", "outward"] },
                  "$productDetails.quantity",
                  0
              ]
          }
              // $sum: "$productDetails.quantity"

          },
          totalDelivered: {
              $sum: "$productDetails.delivered"
              
          },
          totalReturned: {

            $sum: {
              $cond: [
                  { $eq: ["$productDetails.inwardoutward", "inward"] },
                  "$productDetails.quantity",
                  0
              ]
          }

            
          }
        }
      },
      // Project to reshape the output
      {
        $project: {
          _id: 0,
          productId: "$_id.productId",
          productName: "$_id.productName",
          totalLoaded: 1,
          totalDelivered: 1,
          totalReturned: 1
        }
      },
      // Sort by product name
      { $sort: { productName: 1 } }
    ]);

    // Get all products to ensure we show all even if no activity
    const allProducts = await Product.find({}, 'productid name type');
    
    // Merge with product data to include all products
    const mergedData = allProducts.map(product => {
      const summary = productSummaries.find(p => p.productId === product.productid) || {};
      return {
        productId: product.productid,
        productName: product.name,
        productType: product.type,
        totalLoaded: summary.totalLoaded || 0,
        totalDelivered: summary.totalDelivered || 0,
        totalReturned: summary.totalReturned || 0
      };
    });

    res.json({
      success: true,
      data: mergedData
    });

  } catch (err) {
    console.error('Error fetching product summary:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product summary'
    });
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
