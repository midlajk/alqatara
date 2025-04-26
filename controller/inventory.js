require('../model/database');
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Stockdelivery = mongoose.model('Stockdelivery');
const XLSX = require('xlsx');

// Route to handle stock update
exports.updatestockinventory = async (req, res) => {
    try {
      const { truckId, city, productDetails } = req.body;
  
      if (!truckId || !city || !productDetails.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      let details = [];
  
      for (const element of productDetails) {
        const { productid, itemtype, quantity } = element;
        console.log('city',city)
  
        const product = await Product.findOne({ productid });
  
        if (!product) {
          return res.status(404).json({ error: `Product with ID ${productid} not found` });
        }
  
        let cityStock = product.stock.find(s => s.city.toString() === city);
  
        if (!cityStock) {
            // Properly push a new stock entry
            product.stock.push({
              city,
              currentStock: 0,
              oldStock: 0,
              damagedStock: 0,
              discardedStock: 0
            });
            // ❗ After pushing, now find the newly created subdocument
            cityStock = product.stock.find(s => s.city.toString() === city);
          }
        // Save previous values for logging
        const previousStock = cityStock.currentStock;
        const previousOldStock = cityStock.oldStock;
        const previousDamage = cityStock.damagedStock;
        const previousDiscard = cityStock.discardedStock;
  
        // Parse quantity
        const qty = parseInt(quantity);
  
        // Update relevant stock field
        if (qty > 0) {
          if (itemtype === 'Damaged') {
            cityStock.damagedStock += qty;
          } else if (itemtype === 'New') {
            cityStock.currentStock += qty;
          } else {
            cityStock.oldStock += qty;
            cityStock.currentStock += qty;
          }
        } else {
          cityStock.discardedStock += Math.abs(qty);
        }

        product.updatedAt = new Date();
        await product.save();
  
        details.push({
          ...element,
          previousStock,
          previousOldStock,
          previousDamage,
          previousDiscard
        });
      }
  
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

  
    exports.getProducts = async (req, res) => {
        try {
          const { draw, start, length, search } = req.query;
          const city = req.session.city || 'ALL';
      
          const page = Math.ceil(start / length);
          const limit = parseInt(length);
          const skip = page * limit;
      
          let filter = {};
          if (search && search.value) {
            filter = {
              $or: [
                { name: { $regex: search.value, $options: 'i' } },
                { productid: { $regex: search.value, $options: 'i' } }
              ]
            };
          }
      
          const totalRecords = await Product.countDocuments(filter);
      
          const aggregationPipeline = [
            { $match: filter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $addFields: {
                filteredStock: {
                  $cond: {
                    if: { $eq: [city.toUpperCase(), 'ALL'] },
                    then: "$stock",
                    else: {
                      $filter: {
                        input: "$stock",
                        as: "stockItem",
                        cond: { $eq: ["$$stockItem.city", city] }
                      }
                    }
                  }
                }
              }
            },
            {
              $addFields: {
                totalStock: { $sum: "$filteredStock.currentStock" },
                totalDamaged: { $sum: "$filteredStock.damagedStock" },
                totalDiscarded: { $sum: "$filteredStock.discardedStock" },
                totalOld: { $sum: "$filteredStock.oldStock" }

              }
            },
            {
              $project: {
                productid: 1,
                name: 1,
                description: 1,
                totalStock: 1,
                totalDamaged: 1,
                totalDiscarded: 1,
                totalOld:1
              }
            }
          ];
      
          const products = await Product.aggregate(aggregationPipeline);
      
          res.status(200).json({
            draw,
            recordsTotal: totalRecords,
            recordsFiltered: totalRecords,
            data: products
          });
      
        } catch (error) {
          console.error("Error fetching inventory:", error);
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

        if (city && city !== 'ALL') matchStage.city = city;
        
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
        if (city && city !=='ALL') matchStage.city = city;
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


// exports.getsumstockhistory = async (req, res) => {
//     try {
//         const { fromDate, toDate, city, truck, product } = req.query;
        
//         // Date handling
//         const startDate = fromDate ? new Date(fromDate) : new Date();
//         startDate.setHours(0, 0, 0, 0);
        
//         const endDate = toDate ? new Date(toDate) : new Date();
//         endDate.setHours(23, 59, 59, 999);

//         // Base match stage with date range
//         const matchStage = {
//             date: { $gte: startDate, $lte: endDate }
//         };
        
//         // Add optional filters
//         if (city && city !=='ALL') matchStage.city = city;
//         if (truck) matchStage.truckId = truck;
        
//         // For product filter, we'll match after unwinding
//         const productMatchStage = {};
//         if (product) productMatchStage['productDetails.productid'] = product;

//         const pipeline = [
//             { $match: matchStage }, // Apply date/city/truck filters first
//             { $unwind: "$productDetails" },
//             ...(product ? [{ $match: productMatchStage }] : []), // Apply product filter after unwind if needed
//             {
//                 $group: {
//                     _id: null,
//                     firstDocument: { 
//                         $first: {
//                             previousStock: "$productDetails.previousStock",
//                             previousDamage: "$productDetails.previousDamage",
//                             previousDiscard: "$productDetails.previousDiscard"
//                         }
//                     },
//                     stockInward: { 
//                         $sum: {
//                             $cond: [
//                                 { $eq: ["$productDetails.inwardoutward", "inward"] },
//                                 "$productDetails.quantity",
//                                 0
//                             ]
//                         }
//                     },
//                     stockOutward: {
//                         $sum: {
//                             $cond: [
//                                 { $eq: ["$productDetails.inwardoutward", "outward"] },
//                                 "$productDetails.quantity",
//                                 0
//                             ]
//                         }
//                     },
//                     damagedItems: {
//                         $sum: {
//                             $cond: [
//                                 { $eq: ["$productDetails.itemtype", "Damaged"] },
//                                 "$productDetails.quantity",
//                                 0
//                             ]
//                         }
//                     },
//                     disposedStock: {
//                         $sum: {
//                             $cond: [
//                                 { $eq: ["$productDetails.itemtype", "Discarded"] },
//                                 "$productDetails.quantity",
//                                 0
//                             ]
//                         }
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     firstDocument: 1,
//                     stockInward: 1,
//                     stockOutward: 1,
//                     damagedItems: 1,
//                     disposedStock: 1
//                 }
//             }
//         ];

//         const results = await Stockdelivery.aggregate(pipeline);
//         console.log(results)
//         const stats = results[0] || {
//             firstDocument: {
//                 previousStock: 0,
//                 previousDamage: 0,
//                 previousDiscard: 0
//             },
//             stockInward: 0,
//             stockOutward: 0,
//             damagedItems: 0,
//             disposedStock: 0
//         };

//         res.json({
//             success: true,
//             data: stats
//         });

//     } catch (error) {
//         console.error('Error fetching dashboard stats:', error);
//         res.status(500).json({ 
//             success: false,
//             error: 'Internal Server Error',
//             message: error.message 
//         });
//     }
// };



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
    try {
      const { id } = req.body;
  
      const product = await Product.findById(id);
  
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
  
      // Check stock conditions
      const invalidStock = product.stock.some(stock => 
        stock.currentStock !== 0 ||
        stock.oldStock !== 0 ||
        stock.damagedStock !== stock.discardedStock
      );
  
      if (invalidStock) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete product. One or more stock entries still have value or unmatched damage/discarded count.' 
        });
      }
  
      await Product.findByIdAndDelete(id);
  
      res.json({ success: true, message: 'Product deleted successfully' });
  
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

  // Export endpoint for stock history
exports.exportStockHistory = async (req, res) => {
    try {
        const { fromDate, toDate, city, product, truck, search } = req.query;
        console.log(req.query)
        
        // Create match stage with optimized filters (same as getStockhistory)
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

        if (city && city !== 'ALL') matchStage.city = city;
        
        // Truck ID filter
        if (truck !== 'null') matchStage.truckId = truck;

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
            }
        ];

        // Count pipeline for accurate filtered count
        const countPipeline = [
            { $match: matchStage },
            { $unwind: "$productDetails" },
            ...(product ? [{ $match: { 'productDetails.productid': product } }] : []),
            { $count: "total" }
        ];

   
        const data = await Stockdelivery.aggregate(pipeline);
        console.log(data)

        // Format data for CSV/Excel
        const formattedData = data.map(item => ({
            Date: new Date(item.date).toLocaleDateString(),
            'Truck ID': item.truckId,
            City: item.city,
            'Product ID': item.productid,
            'Product Name': item.productname,
            Quantity: item.quantity,
            'In/Out': item.inwardoutward,
            Time: item.time ? new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
            'Item Type': item.itemtype,
            'Done By': item.doneby
        }));

        // Set headers for Excel download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=stock_history_export.csv');

        // Convert to CSV
        const json2csv = require('json2csv').parse;
        const csv = json2csv(formattedData, {
            fields: ['Date', 'Truck ID', 'City', 'Product ID', 'Product Name', 'Quantity', 'In/Out', 'Time', 'Item Type', 'Done By'],
            excelStrings: true
        });

        res.send(csv);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};