require('../model/database');
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Stockdelivery = mongoose.model('Stockdelivery');

// Route to handle stock update
exports.updatestockinventory = async (req, res) => {
    try {
        const { truckId, city, productDetails } = req.body;
        console.log(req.body)

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
            let previousDamage = product.damagedStock || 0;
            let previousDiscard = product.discardedStock || 0;

            // Update stock based on type and quantity
            if (element.quantity > 0) {
                if (element.itemtype !== 'Damaged') {
                    product.currentStock += parseInt(element.quantity);
                } else {
                    product.damagedStock = parseInt(product.damagedStock || 0) + parseInt(element.quantity);
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
                type,
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

      // Pagination and filtering logic
      const page = Math.ceil(start / length);
      const limit = length;
      const skip = page * limit;

      let filter = {};
      if (search && search.value) {
          filter = {
              $or: [
                  { name: { $regex: search.value, $options: 'i' } },
                  { type: { $regex: search.value, $options: 'i' } },
                  { description: { $regex: search.value, $options: 'i' } }
              ]
          };
      }

      // Fetch total count of documents that match the filter
      const totalRecords = await Product.countDocuments(filter);

      // Fetch paginated data
      const products = await Product.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }); // You can change this to any sorting criterion you prefer

      // Send the data along with pagination info
      res.status(200).json({
          draw: draw,
          recordsTotal: totalRecords,
          recordsFiltered: totalRecords,
          data: products
      });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Route to get products for Select2
// router.get('/products', async (req, res) => {
  exports.getProductnames = async (req, res) => {
  try {
      // Fetch product data from the database
      const products = await Product.find({}, 'productid name').limit(50); // Adjust limit based on your needs
console.log(products)
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
        const { fromDate, toDate, city, start, length, search, draw, product } = req.query;
        
        // Create match stage with optimized filters
        const matchStage = {};
        
        if (city) matchStage.city = city;
        if (product) matchStage["productDetails.productid"] = product;
        console.log(fromDate,toDate)
        if (fromDate && toDate) {
            matchStage.date = { 
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        // Text search if needed
        if (search?.value) {
            matchStage.$or = [
                { truckId: { $regex: search.value, $options: "i" } },
                { "productDetails.doneby": { $regex: search.value, $options: "i" } }
            ];
        }

        // Aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            { $unwind: "$productDetails" },
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
                    doneby: "$productDetails.doneby"
                }
            },
            { $skip: parseInt(start) || 0 },
            { $limit: parseInt(length) || 25 }
        ];

        // Get data and count in parallel
        const [data, total] = await Promise.all([
            Stockdelivery.aggregate(pipeline),
            Stockdelivery.countDocuments(matchStage) // Approximate count
        ]);

        res.json({
            draw: parseInt(draw),
            recordsTotal: total,
            recordsFiltered: total,
            data: data
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




exports.getsumstockhistory = async (req, res) => {
    try {
        const { fromDate, toDate, city } = req.query;
        
        // Default to current day if no dates provided
        const today = new Date();
        const defaultFrom = new Date(today.setHours(0, 0, 0, 0));
        const defaultTo = new Date(today.setHours(23, 59, 59, 999));
        
        const matchStage = {
            date: {
                $gte: fromDate ? new Date(fromDate) : defaultFrom,
                $lte: toDate ? new Date(toDate) : defaultTo
            }
        };
        
        if (city) matchStage.city = city;

        const pipeline = [
            { $match: matchStage },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: null,
                    previousStock: { $sum: "$productDetails.previousstock" },
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
                    damagedItems: { $sum: "$productDetails.previousdamage" },
                    disposedStock: { $sum: "$productDetails.previousdiscard" },
                    currentStock: {
                        $sum: {
                            $subtract: [
                                { $add: ["$productDetails.previousstock", "$productDetails.quantity"] },
                                { $add: ["$productDetails.previousdamage", "$productDetails.previousdiscard"] }
                            ]
                        }
                    }
                }
            }
        ];

        const results = await Stockdelivery.aggregate(pipeline);
        console.log(results)
        const stats = results[0] || {
            previousStock: 0,
            stockInward: 0,
            stockOutward: 0,
            damagedItems: 0,
            disposedStock: 0,
            currentStock: 0
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}