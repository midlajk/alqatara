require('../model/database');
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Stockdelivery = mongoose.model('Stockdelivery');

// Route to handle stock update
exports.updatestockinventory = async (req, res) => {
    try {
        const { truckId, city, productDetails } = req.body;

        if (!truckId || !city || !productDetails.length) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let details = [];

        for (const element of productDetails) {
            // Find the product by ID
            const product = await Product.findOne({ productid: element.productid });

            if (!product) {
                return res.status(404).json({ error: `Product with ID ${element.productid} not found` });
            }

            let previousStock = product.currentStock;
            let previousoldstock = product.oldStock;

            let previousDamage = product.damagedStock || 0;
            let previousDiscard = product.discardedStock || 0;

            // Update stock based on type and quantity
            if (element.quantity > 0) {
                if (element.itemtype === 'Damaged') {
                    product.damagedStock = parseInt(product.damagedStock || 0) + parseInt(element.quantity);
                } else if (element.itemtype == 'New') {
                    product.currentStock = parseInt(product.currentStock || 0) + parseInt(element.quantity);
                } else {
                    product.currentStock = parseInt(product.currentStock || 0) + parseInt(element.quantity);
                    product.previousoldstock = parseInt(product.previousoldstock || 0) + Math.abs(element.quantity);
                }
                
            } else {
                product.discardedStock = parseInt(product.discardedStock || 0) + Math.abs(element.quantity);
            }

            // Save updated product
            await product.save();

            details.push({
                ...element,
                previousStock,
                previousDamage,
                previousDiscard
            });
        }

        // Save stock movement record
        const newStock = new Stockdelivery({
            truckId,
            city,
            productDetails: details
        });

        await newStock.save();

        res.status(201).json({ message: "Stock updated successfully!", updatedStock: newStock });

    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.addOrUpdateProduct = async (req, res) => {
    try {
        const { productid, name, type, priority, description } = req.body;

        if (!productid) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { productid }, // Find product by ID
            {   productid,
                name,
                type:type||'New',
                priority,
                description,
                updatedAt: Date.now()
            },
            { new: true, upsert: true, runValidators: true } // Creates if not exists
        );

        res.status(200).json({ message: 'Product added/updated successfully', updatedProduct });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// exports.getProducts = async (req, res) => {
//   try {
//       const { draw, start, length, search } = req.query;

//       // Pagination and filtering logic
//       const page = Math.ceil(start / length);
//       const limit = length;
//       const skip = page * limit;

//       let filter = {};
//       if (search && search.value) {
//           filter = {
//               $or: [
//                   { name: { $regex: search.value, $options: 'i' } },
//                   { type: { $regex: search.value, $options: 'i' } },
//                   { description: { $regex: search.value, $options: 'i' } }
//               ]
//           };
//       }

//       // Fetch total count of documents that match the filter
//       const totalRecords = await Product.countDocuments(filter);

//       // Fetch paginated data
//       const products = await Product.find(filter)
//           .skip(skip)
//           .limit(limit)
//           .sort({ createdAt: -1 }); // You can change this to any sorting criterion you prefer

//       // Send the data along with pagination info
//       res.status(200).json({
//           draw: draw,
//           recordsTotal: totalRecords,
//           recordsFiltered: totalRecords,
//           data: products
//       });
//   } catch (error) {
//       console.log(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// Route to get products for Select2
// router.get('/products', async (req, res) => {
 
    exports.getProducts = async (req, res) => {
        try {
            const { draw, start, length, search } = req.query;
    
            const page = Math.ceil(start / length);
            const limit = length;
            const skip = page * limit;
    
            let filter = {};
            if (search && search.value) {
                filter = {
                    $or: [
                        { name: { $regex: search.value, $options: 'i' } },
                        { description: { $regex: search.value, $options: 'i' } }
                    ]
                };
            }
    
            const totalRecords = await Product.countDocuments(filter);
            const products = await Product.find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
    
            const flatData = products.map(product => {
                const totalStock = product.stock.reduce((acc, entry) => {
                    acc += entry.currentStock || 0;
                    return acc;
                }, 0);
    
                return {
                    ...product.toObject(),
                    totalStock,
                    stockByCity: product.stock
                };
            });
    
            res.status(200).json({
                draw,
                recordsTotal: totalRecords,
                recordsFiltered: totalRecords,
                data: flatData
            });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
 
 
    exports.getProductnames = async (req, res) => {
  try {
      // Fetch product data from the database
      const products = await Product.find({}, 'productid name').limit(50); // Adjust limit based on your needs
      // Map products to the format that Select2 expects
      const results = products.map(product => ({
          id: product.productid,
          text: product.name
      }));

      // Send the results as JSON
      res.json({ results });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
};



exports.getStockhistory = async (req, res) => {
    try {
        const { fromDate, toDate, city, start, length, search, draw, product, truck } = req.query;
        // Create match stage with optimized filters
        const matchStage = {};
        
        // Date filtering
        const startDate = fromDate ? new Date(fromDate) : new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = toDate ? new Date(toDate) : new Date();
        endDate.setHours(23, 59, 59, 999);

        matchStage.date = { 
            $gte: startDate, 
            $lte: endDate 
        };

        // City filter
        if (city) matchStage.city = city;
        
        // Truck ID filter
        if (truck) matchStage.truckId = truck;

        // Product ID filter (inside productDetails array)
        if (product) {
            matchStage['productDetails.productid'] = product;
        }

        // Text search if needed
        if (search?.value) {
            matchStage.$or = [
                { truckId: { $regex: search.value, $options: "i" } },
                { 'productDetails.doneby': { $regex: search.value, $options: "i" } },
                { 'productDetails.productname': { $regex: search.value, $options: "i" } }
            ];
        }

        // Aggregation pipeline with optimized filtering
        const pipeline = [
            { $match: matchStage },
            { $unwind: "$productDetails" },
            // Apply product filter after unwind if specified
            ...(product ? [{ $match: { 'productDetails.productid': product } }] : []),
            { 
                $project: {
                    date: 1,
                    truckId: 1,
                    city: 1,
                    status: 1,
                    productid: "$productDetails.productid",
                    productname: "$productDetails.productname",
                    quantity: "$productDetails.quantity",
                    inwardoutward: "$productDetails.inwardoutward",
                    time: "$productDetails.time",
                    itemtype: "$productDetails.itemtype",
                    doneby: "$productDetails.doneby",
                    city: "$productDetails.city"
                }
            },
            { $skip: parseInt(start) || 0 },
            { $limit: parseInt(length) || 25 }
        ];

        // Count pipeline for accurate filtered count
        const countPipeline = [
            { $match: matchStage },
            { $unwind: "$productDetails" },
            ...(product ? [{ $match: { 'productDetails.productid': product } }] : []),
            { $count: "total" }
        ];

        // Get data and counts in parallel
        const [data, total, filtered] = await Promise.all([
            Stockdelivery.aggregate(pipeline),
            Stockdelivery.countDocuments(), // Total records
            Stockdelivery.aggregate(countPipeline).then(res => res[0]?.total || 0) // Filtered count
        ]);

        res.json({
            draw: parseInt(draw),
            recordsTotal: total,
            recordsFiltered: filtered,
            data: data
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.getsumstockhistory = async (req, res) => {
    try {
        const { fromDate, toDate, city, truck, product } = req.query;
        
        // Date handling
        const startDate = fromDate ? new Date(fromDate) : new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = toDate ? new Date(toDate) : new Date();
        endDate.setHours(23, 59, 59, 999);

        // Base match stage with date range
        const matchStage = {
            date: { $gte: startDate, $lte: endDate }
        };
        
        // Add optional filters
        if (city) matchStage.city = city;
        if (truck) matchStage.truckId = truck;
        
        // For product filter, we'll match after unwinding
        const productMatchStage = {};
        if (product) productMatchStage['productDetails.productid'] = product;

        const pipeline = [
            { $match: matchStage }, // Apply date/city/truck filters first
            { $unwind: "$productDetails" },
            ...(product ? [{ $match: productMatchStage }] : []), // Apply product filter after unwind if needed
            {
                $group: {
                    _id: null,
                    firstDocument: { 
                        $first: {
                            previousStock: "$productDetails.previousStock",
                            previousDamage: "$productDetails.previousDamage",
                            previousDiscard: "$productDetails.previousDiscard"
                        }
                    },
                    stockInward: { 
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.inwardoutward", "inward"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    },
                    stockOutward: {
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.inwardoutward", "outward"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    },
                    damagedItems: {
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.itemtype", "Damaged"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    },
                    disposedStock: {
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.itemtype", "Discarded"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    firstDocument: 1,
                    stockInward: 1,
                    stockOutward: 1,
                    damagedItems: 1,
                    disposedStock: 1
                }
            }
        ];

        const results = await Stockdelivery.aggregate(pipeline);
        console.log(results)
        const stats = results[0] || {
            firstDocument: {
                previousStock: 0,
                previousDamage: 0,
                previousDiscard: 0
            },
            stockInward: 0,
            stockOutward: 0,
            damagedItems: 0,
            disposedStock: 0
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: error.message 
        });
    }
};


exports.getsumstockhistory = async (req, res) => {
    try {
        const { fromDate, toDate, city, truck, product } = req.query;
        
        // Date handling
        const startDate = fromDate ? new Date(fromDate) : new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = toDate ? new Date(toDate) : new Date();
        endDate.setHours(23, 59, 59, 999);

        // Base match stage with date range
        const matchStage = {
            date: { $gte: startDate, $lte: endDate }
        };
        
        // Add optional filters
        if (city) matchStage.city = city;
        if (truck) matchStage.truckId = truck;
        
        // For product filter, we'll match after unwinding
        const productMatchStage = {};
        if (product) productMatchStage['productDetails.productid'] = product;

        const pipeline = [
            { $match: matchStage }, // Apply date/city/truck filters first
            { $unwind: "$productDetails" },
            ...(product ? [{ $match: productMatchStage }] : []), // Apply product filter after unwind if needed
            {
                $group: {
                    _id: null,
                    firstDocument: { 
                        $first: {
                            previousStock: "$productDetails.previousStock",
                            previousDamage: "$productDetails.previousDamage",
                            previousDiscard: "$productDetails.previousDiscard"
                        }
                    },
                    stockInward: { 
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.inwardoutward", "inward"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    },
                    stockOutward: {
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.inwardoutward", "outward"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    },
                    damagedItems: {
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.itemtype", "Damaged"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    },
                    disposedStock: {
                        $sum: {
                            $cond: [
                                { $eq: ["$productDetails.itemtype", "Discarded"] },
                                "$productDetails.quantity",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    firstDocument: 1,
                    stockInward: 1,
                    stockOutward: 1,
                    damagedItems: 1,
                    disposedStock: 1
                }
            }
        ];

        const results = await Stockdelivery.aggregate(pipeline);
        console.log(results)
        const stats = results[0] || {
            firstDocument: {
                previousStock: 0,
                previousDamage: 0,
                previousDiscard: 0
            },
            stockInward: 0,
            stockOutward: 0,
            damagedItems: 0,
            disposedStock: 0
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error',
            message: error.message 
        });
    }
};



exports.getproductsnames = async (req, res) => {
        try {
            const searchTerm = req.query.q || '';
            
            // Finding products that match the search term in their name
            const products = await Product.find(
              { name: { $regex: searchTerm, $options: 'i' } },
              '_id name price' // Only return these fields
            )
            .limit(20); // Limit results for performance
            
            // Format data for Select2
            const results = products.map(product => ({
              id: product.name, //// need to change to _id if neccessary 
              text: product.name,
              price: product.price
            }));
            
            // Return in Select2 expected format
            res.json({
              results: results,
              pagination: {
                more: false // Set to true if you implement pagination
              }
            });
            
          } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).json({ error: 'An error occurred while searching products' });
          }
  
};

exports.deleteproduct = async (req, res) => {

    //////////Need to do operation /////////
    try {
      const { id } = req.body;
      const deletedRoute = await Product.findByIdAndDelete(id);
      if (!deletedRoute) {
        return res.status(404).json({ success: false, message: 'Route not found' });
      }
      res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  
  };