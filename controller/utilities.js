
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck');
const TruckHistory = mongoose.model('TruckHistory')
const Product = mongoose.model('Product');
const Stockdelivery = mongoose.model('Stockdelivery');
const PDFDocument = require('pdfkit');

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
      if (req.session.city && req.session.city !== 'ALL') {
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
    let startDate, endDate;

    if (fromDate) {
      startDate = new Date(fromDate);
    } else {
      startDate = new Date();            // now
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);

    // 2) If toDate is missing or invalid, default to today at 23:59:59.999
    if (toDate) {
      endDate = new Date(toDate);
    } else {
      endDate = new Date();
    }
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

function summarizeDetails(details, productId) {
  let totalInward   = 0;
  let totalOutward  = 0;
  let totalDelivered = 0;

  details.forEach(d => {
    if (d.productid !== productId) return;
    if (d.inwardoutward === 'inward')   totalInward   += d.quantity;
    if (d.inwardoutward === 'outward')  totalOutward  += d.quantity;
    if (typeof d.delivered === 'number') totalDelivered += d.delivered;
  });

  return { totalInward, totalOutward, totalDelivered };
}

// exports.UpdateTruckStrocks = async (req, res) => {
//   try {
//     const { truckId, productName, actionType, itemStatus, quantity, city, doneby, productId } = req.body;
    
//     // Validate input
//     if (!truckId || !productName || !actionType || !quantity || quantity <= 0) {
//       return res.status(400).json({ 
//         success: false, 
//         error: "Invalid input data" 
//       });
//     }

//     // Find truck - use findOne instead of find
//     const truck = await Truck.findOne({ id: truckId });
//     if (!truck) {
//       return res.status(404).json({ success: false, error: "Truck not found" });
//     }
    
//     // Find product
//     const product = await Product.findOne({ productid: productId });
//     if (!product) {
//       return res.status(404).json({ 
//         success: false, 
//         error: `Product ${productName} not found in inventory` 
//       });
//     }

//     // Get previous stock values
//     const previousStock = product.currentStock || 0;
//     const previousDamage = product.damagedStock || 0;
//     const previousDiscard = product.discardedStock || 0;
    
//     // Create new product detail
//     const productDetail = {
//       productid: productId,
//       productname: productName,
//       quantity: quantity,
//       inwardoutward: actionType,
//       time: new Date(),
//       itemtype: itemStatus,
//       doneby: doneby,
//       city: city,
//       previousStock: previousStock,
//       previousDamage: previousDamage,
//       previousDiscard: previousDiscard
//     };
    
//     // Initialize productDetails array if it doesn't exist
//     if (!truck.productDetails) {
//       truck.productDetails = [];
//     }
    
//     // Update truck's productDetails
//     truck.productDetails.push(productDetail);
    
//     // Update product inventory based on action
//     if (actionType === 'outward') {
//       product.currentStock -= quantity; // Remove from inventory

//     } else {
//       // For outward movement
//       // product.currentStock += quantity; // Return to inventory
      
//       if (itemStatus === 'Damaged') {
//         product.damagedStock += quantity;
//       } else{
//         product.currentStock += quantity; // Return to inventory

//       }
//       // else if (itemStatus === 'Old') {
//       //   product.discardedStock += quantity;
//       // }
//     }
    
//     // Save both documents
//     await Promise.all([
//       truck.save(),
//       product.save()
//     ]);
//     console.log(truck)
//     res.json({ 
//       success: true, 
//       data: {
//         truck: truck,
//         product: product
//       } 
//     });
    
//   } catch (error) {
//     console.log('Error updating truck stock:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal Server Error',
//       message: error.message 
//     });
//   }
// };
///apis 
exports.UpdateTruckStrocks = async (req, res) => {
  try {
    const { truckId, productName, actionType, itemStatus, quantity, city, doneby, productId, store } = req.body;

    // Validate input
    if (!truckId || !productName || !actionType || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: "Invalid input data" });
    }

    const truck = await Truck.findOne({ id: truckId });
    if (!truck) {
      return res.status(404).json({ success: false, error: "Truck not found" });
    }

    const product = await Product.findOne({ productid: productId });
    if (!product) {
      return res.status(404).json({ success: false, error: `Product ${productName} not found in inventory` });
    }

    // Find stock for the given city
    console.log(store)
    let cityStock = product.stock.find(s => s.city === store);
    if (!cityStock) {
      return res.status(400).json({ success: false, error: `No stock data found for ${store} city.` });
    }

    let previousStock = cityStock.currentStock;
    let previousDamage = cityStock.damagedStock;
    let previousDiscard = cityStock.discardedStock;
    let previousoldStock = cityStock.oldStock;

    const qty = quantity; // cleaner name

    if (actionType === 'outward') {
      // Check if enough stock is available for outward
      if (itemStatus === 'Damaged' && cityStock.damagedStock < qty) {
        return res.status(400).json({ success: false, error: `Insufficient damaged stock for ${productName} in ${store}.` });
      }
      if (itemStatus === 'New' && cityStock.currentStock < qty) {
        return res.status(400).json({ success: false, error: `Insufficient new stock for ${productName} in ${store}.` });
      }
      if (itemStatus == 'Old' && cityStock.oldStock < qty) {
        return res.status(400).json({ success: false, error: `Insufficient old stock for ${productName} in ${store}.` });
      }

      // Now deduct
      if (qty > 0) {
        if (itemStatus === 'Damaged') {
          cityStock.damagedStock -= qty;
        } else if (itemStatus === 'New') {
          cityStock.currentStock -= qty;
        } else {
          cityStock.oldStock -= qty;
          cityStock.currentStock -= qty;
        }
      }
    } else if (actionType === 'inward') {
      // Increase based on item type
      const { totalInward, totalOutward, totalDelivered } =
      summarizeDetails(truck.productDetails, productId);
      const available = totalOutward-totalInward  - totalDelivered;
      if (available < quantity) {
        return res.status(400).json({
          success: false,
          error: `Cannot Return ${quantity} units. Only ${available} remaining on truck.`
        });
      }
    

      if (qty > 0) {
        if (itemStatus === 'Damaged') {
          cityStock.damagedStock += qty;
        } else if (itemStatus === 'New') {
          cityStock.currentStock += qty;
        } else {
          cityStock.oldStock += qty;
          cityStock.currentStock += qty;
        }
      } 
    }

    // Save product first
    await product.save();

    // Save to truck movement
    const productDetail = {
      productid: productId,
      productname: productName,
      quantity: qty,
      inwardoutward: actionType,
      time: new Date(),
      itemtype: itemStatus,
      doneby: doneby,
      city: store,
      previousStock,
      previousDamage,
      previousDiscard,
      previousoldStock,
    };

    if (!truck.productDetails) {
      truck.productDetails = [];
    }
    truck.productDetails.push(productDetail);

    await truck.save();

    // Create stock delivery monitoring
    const stockDelivery = new Stockdelivery({
      truckId: truck.id,
      city: store,
      date: new Date(),
      productDetails: [productDetail],
      status: 'completed'
    });

    await stockDelivery.save();

    res.json({
      success: true,
      data: {
        truck,
        product,
        stockDelivery
      }
    });

  } catch (error) {
    console.log('Error updating truck stock:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
  }
};


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
      // stockDelivery.save(),
      truckHistory.save(),
      truck.save()
    ]);

    
    res.json({ 
      success: true,
      message: "Stock successfully closed and archived",
      data: {
        // stockDeliveryId: stockDelivery._id,
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





exports.printTruckstock = async (req, res) => {
  try {
    const { id } = req.params;
    const truck = await Truck.findOne({ id })
      .lean();
    
    if (!truck) {
      return res.status(404).send('Truck not found');
    }
    
    truck.productDetails = Array.isArray(truck.productDetails)
      ? truck.productDetails
      : [];
    
    // Set the response headers to serve a PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="truck_${truck.id}_report.pdf"`
    );
    
    // Create a new PDF document with better margins
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      bufferPages: true // Enable page numbering
    });
    
    doc.pipe(res);
    
    // Add company logo if available
    // doc.image('path/to/logo.png', 50, 45, { width: 150 });
    
    // Background color for header
    doc.rect(0, 0, doc.page.width, 120).fill('#f6f6f6');
    
    // --- HEADER SECTION ---
    doc
      .fontSize(24)
      .fillColor('#003366')
      .text(`TRUCK REPORT`, 50, 50, { align: 'center' })
      .fontSize(18)
      .text(`ID: ${truck.id}`, 50, 80, { align: 'center' })
      .moveDown(2);
    
    // --- TRUCK INFORMATION BOX ---
    const infoBoxY = 140;
    doc.roundedRect(50, infoBoxY, doc.page.width - 100, 100, 10)
       .lineWidth(1)
       .stroke('#cccccc');
    
    doc
      .fontSize(14)
      .fillColor('#000000')
      .text('Truck Information', 70, infoBoxY + 15)
      .moveDown(0.5);
    
    // Create two columns for truck info
    doc.fontSize(11);
    const leftColX = 70;
    const rightColX = 300;
    
    doc.fillColor('#555555')
      .text(`City:`, leftColX, doc.y)
      .fillColor('#000000')
      .text(`${truck.city || 'N/A'}`, leftColX + 80, doc.y - 11)
      .fillColor('#555555')
      .text(`Route ID:`, rightColX, doc.y - 11)
      .fillColor('#000000')
      .text(`${truck.routeId || 'N/A'}`, rightColX + 80, doc.y - 11)
      .moveDown(0.5);
    
    doc.fillColor('#555555')
      .text(`Salesman ID:`, leftColX, doc.y)
      .fillColor('#000000')
      .text(`${truck.salesmanId || 'N/A'}`, leftColX + 80, doc.y - 11)
      .fillColor('#555555')
      .text(`Report Date:`, rightColX, doc.y - 11)
      .fillColor('#000000')
      .text(`${new Date().toLocaleDateString()}`, rightColX + 80, doc.y - 11)
      .moveDown(2);

    
    // --- PRODUCT DETAILS SECTION ---
    doc.fontSize(14)
      .fillColor('#003366')
      .text('Product Movement Details', 50, doc.y)
      .moveDown(0.5);
    
    // Table header with background
    const tableTop = doc.y;
    const itemX = 70;
    const qtyX  = 220;
    const typeX = 300;
    const timeX = 380;
    const byX   = 480;
    
    // Header row with background
    doc.rect(50, tableTop, doc.page.width - 100, 20)
      .fill('#003366');
    
    doc.fillColor('#ffffff')
      .fontSize(11)
      .text('Product', itemX, tableTop + 5)
      .text('Qty', qtyX, tableTop + 5)
      .text('Status', typeX, tableTop + 5)
      .text('Time', timeX, tableTop + 5)
      .text('By', byX, tableTop + 5);
    
    // Table rows
    if (truck.productDetails.length) {
      let rowY = tableTop + 20;
      
      truck.productDetails.forEach((pd, i) => {
        // Check if we need a new page
        if (rowY > doc.page.height - 100) {
          doc.addPage();
          rowY = 50;
          
          // Repeat header on new page
          doc.rect(50, rowY, doc.page.width - 100, 20)
            .fill('#003366');
          
          doc.fillColor('#ffffff')
            .fontSize(11)
            .text('Product', itemX, rowY + 5)
            .text('Qty', qtyX, rowY + 5)
            .text('Status', typeX, rowY + 5)
            .text('Time', timeX, rowY + 5)
            .text('By', byX, rowY + 5);
          
          rowY += 20;
        }
        
        // Alternating row colors
        doc.rect(50, rowY, doc.page.width - 100, 20)
          .fill(i % 2 === 0 ? '#f9f9f9' : '#ffffff');
        
        // Format the date
        const date = new Date(pd.time);
        const formattedDate = date.toLocaleDateString() + ' ' + 
          date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Check if outward and display appropriate text
        const isOutward = pd.inwardoutward && pd.inwardoutward.toLowerCase() === 'outward';
        const movementStatus = isOutward ? 'Added to Truck' : 'Returned from Truck';
        
        // Different colors for added vs returned
        const statusColor = isOutward ? '#008800' : '#cc0000';
        
        doc.fillColor('#000000')
          .fontSize(10)
          .text(pd.productname || 'N/A', itemX, rowY + 5, { width: 140 })
          .text(pd.quantity || '0', qtyX, rowY + 5);
        
        // Use different color for status
        doc.fillColor(statusColor)
          .text(movementStatus, typeX, rowY + 5);
        
        // Back to normal color for remaining fields
        doc.fillColor('#000000')
          .text(formattedDate, timeX, rowY + 5, { width: 90 })
          .text(pd.doneby || 'N/A', byX, rowY + 5);
        
        rowY += 20;
      });
    } else {
      doc.rect(50, tableTop + 20, doc.page.width - 100, 30)
        .fill('#f9f9f9');
      
      doc.fillColor('#555555')
        .fontSize(11)
        .text('No product movements recorded.', 
              doc.page.width / 2 - 100, 
              tableTop + 30, 
              { align: 'center', italic: true });
    }
    
    // Add footer with page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.rect(50, doc.page.height - 50, doc.page.width - 100, 1)
        .fill('#cccccc');
      
      // Page number and date
      doc.fillColor('#555555')
        .fontSize(9)
        .text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 35,
          { align: 'center' }
        );
    }
    
    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Failed to generate PDF');
  }
};