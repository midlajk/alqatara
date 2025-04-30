
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Customer = mongoose.model('Customer')
const Salesman = mongoose.model('Salesman')
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ExcelJS = require("exceljs");
const createError = require('http-errors');
const Order = mongoose.model('Order')
const CommissionSchema = mongoose.model('CommissionSchema')

exports.customerreport = async (req, res) => {
    res.render('reports/customerreport', { title: 'Al Qattara' ,route:'Reports',sub :'Customer Report'});

  };
  exports.creditreport = async (req, res) => {
    res.render('reports/creditreport', { title: 'Al Qattara' ,route:'Reports',sub :'Credit Report'});

  };
  exports.truckreport = async (req, res) => {
    res.render('reports/truckreport', { title: 'Al Qattara' ,route:'Reports',sub :'Truck Report'});

  };



// Helper function to get the first and last date of the current month
function getCurrentMonthDateRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startOfMonth, endOfMonth };
}

// Route to fetch salesperson report api calls
// exports.getsalesmanreport = async (req, res) => {
//   try {
//     const { fromDate, toDate } = req.query;
//     // migrateSalesmanData();
//     let startDate, endDate;

//     if (fromDate && toDate) {
//       startDate = new Date(fromDate);
//       endDate = new Date(toDate);
//     } else {
//       // Default to current month's date range
//       const { startOfMonth, endOfMonth } = getCurrentMonthDateRange();
//       startDate = startOfMonth;
//       endDate = endOfMonth;
//     }

    
// const aggregationPipeline = [
//   {
//     $project: {
//       id: 1,
//       name: 1,
//       city: 1,
//       filteredBottleSecurityDeposits: {
//         $filter: {
//           input: "$collectedBottleSecurityDeposits",
//           as: "deposit",
//           cond: {
//             $and: [
//               { $gte: ["$$deposit.date", startDate] },
//               { $lte: ["$$deposit.date", endDate] }
//             ]
//           }
//         }
//       },
//       filteredCoolerSecurityDeposits: {
//         $filter: {
//           input: "$collectedCoolerSecurityDeposits",
//           as: "deposit",
//           cond: {
//             $and: [
//               { $gte: ["$$deposit.date", startDate] },
//               { $lte: ["$$deposit.date", endDate] }
//             ]
//           }
//         }
//       }
//     }
//   },
//   {
//     $addFields: {
//       totalBottleDeposits: { $sum: "$filteredBottleSecurityDeposits.amount" },
//       totalCoolerDeposits: { $sum: "$filteredCoolerSecurityDeposits.amount" },
//       totalCollection: {
//         $add: [
//           { $sum: "$filteredBottleSecurityDeposits.amount" },
//           { $sum: "$filteredCoolerSecurityDeposits.amount" }
//         ]
//       }
//     }
//   },
//   {
//     $project: {
//       filteredBottleSecurityDeposits: 0,
//       filteredCoolerSecurityDeposits: 0
//     }
//   }
// ];

//   const result = await Salesman.aggregate(aggregationPipeline);
 
//     res.json(result);
//   } catch (error) {
//     console.error('Error fetching salesperson report:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };
exports.getsalesmanreport = async (req, res) => {
  try {
    const { fromDate, toDate,download } = req.query;
    let startDate, endDate;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      const { startOfMonth, endOfMonth } = getCurrentMonthDateRange();
      startDate = startOfMonth;
      endDate = endOfMonth;
    }

    const aggregationPipeline = [
      {
        $lookup: {
          from: "customerassethistories",
          let: { salesmanId: "$id" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$salesmanId", "$$salesmanId"] },
                    { $gte: ["$createdAt", startDate] },
                    { $lte: ["$createdAt", endDate] }
                  ]
                }
              } 
            },
            {
              $group: {
                _id: null,
                totalSecurityDeposit: { $sum: "$securityDeposit" }
              }
            }
          ],
          as: "securityDeposits"
        }
      },
      {
        $lookup: {
          from: "recharges",
          let: { salesmanId: "$id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$salesmanId", "$$salesmanId"] },
                    { $gte: ["$createdAt", startDate] },
                    { $lte: ["$createdAt", endDate] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalWalletCollection: { $sum: "$amount" }
              }
            }
          ],
          as: "walletCollection"
        }
      },
      {
        $lookup: {
          from: "creditorderhistories",
          let: { salesmanId: "$id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$salesmanid", "$$salesmanId"] },
                    { $gte: ["$createdAt", startDate] },
                    { $lte: ["$createdAt", endDate] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalCreditCollection: { $sum: "$creditAmountPaid" }
              }
            }
          ],
          as: "creditCollection"
        }
      },
      {
        $addFields: {
          totalBottleDeposits: {
            $ifNull: [
              { $arrayElemAt: ["$securityDeposits.totalSecurityDeposit", 0] }, 0
            ]
          },
          totalWalletCollection: { 
            $ifNull: [{ $arrayElemAt: ["$walletCollection.totalWalletCollection", 0] }, 0] 
          },
          totalCreditCollection: { 
            $ifNull: [{ $arrayElemAt: ["$creditCollection.totalCreditCollection", 0] }, 0] 
          }
        }
      },
      {
        $addFields: {
          totalCollection: {
            $add: [
              "$totalBottleDeposits",
              "$totalWalletCollection",
              "$totalCreditCollection"
            ]
          }
        }
      },
      {
        $project: {
          securityDeposits: 0,
          walletCollection: 0,
          creditCollection: 0
        }
      }
    ];

    const result = await Salesman.aggregate(aggregationPipeline);

    
    if (download == "Yes") {
      console.log(download)
      // Convert JSON data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(result);

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Salesman Report");

      // Write to buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      // Set response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=salesman_report.xlsx");

      // Send file as response
      return res.send(excelBuffer);
    }
 
      res.json(result);
    
    
  } catch (error) {
    console.error("Error fetching salesman report:", error);
    res.status(500).send("Internal Server Error");
  }
};



///converting data
// async function migrateSalesmanData() {
//     try {
     
//     const currentDate = new Date();


//     const result = await Salesman.updateMany(
//       {},
//       [
//         {
//           $set: {
//             "collectedBottleSecurityDeposits": {
//               $map: {
//                 input: "$collectedBottleSecurityDeposits",
//                 as: "deposit",
//                 in: {
//                     date: { $toDate: "$$deposit.date" }, // Set current date
//                   amount: "$$deposit.amount",
//                   customerId: "$$deposit.customerId",
//                 },
//               },
//             },
//             "collectedCoolerSecurityDeposits": {
//               $map: {
//                 input: "$collectedCoolerSecurityDeposits",
//                 as: "deposits",
//                 in: {
//                     date: { $toDate: "$$deposits.date" }, // Set current date
//                   amount: "$$deposits.amount",
//                   customerId: "$$deposits.customerId",
//                 },
//               },
//             },
//           },
//         },
//       ]
//     );

//     //   const bulkOperations = salesmen.map((salesman) => {
//     //     let updated = false;
    
//     //     // Convert `collectedBottleSecurityDeposits.date` if it's a string
//     //     salesman.collectedBottleSecurityDeposits = salesman.collectedBottleSecurityDeposits.map((deposit) => {
//     //       if (typeof deposit.date === "string") {
//     //         deposit.date = new Date(deposit.date);
//     //         updated = true;
//     //       }
//     //       return deposit;
//     //     });
    
//     //     // Convert `collectedCoolerSecurityDeposits.date` if it's a string
//     //     salesman.collectedCoolerSecurityDeposits = salesman.collectedCoolerSecurityDeposits.map((deposit) => {
//     //       if (typeof deposit.date === "string") {
//     //         deposit.date = new Date(deposit.date);
//     //         updated = true;
//     //       }
//     //       return deposit;
//     //     });
    
//     //     // If no updates were made, skip this document
//     //     if (!updated) return null;
    
//     //     return {
//     //       updateOne: {
//     //         filter: { _id: salesman._id },
//     //         update: {
//     //           $set: {
//     //             collectedBottleSecurityDeposits: salesman.collectedBottleSecurityDeposits,
//     //             collectedCoolerSecurityDeposits: salesman.collectedCoolerSecurityDeposits,
//     //           },
//     //         },
//     //       },
//     //     };
//     //   }).filter(Boolean); // Remove `null` values (i.e., unchanged documents)
    
//     //   if (bulkOperations.length > 0) {
//     //     await Salesman.bulkWrite(bulkOperations);
//     //     console.log(`Updated ${bulkOperations.length} salesmen.`);
//     //   } else {
//     //     console.log("No updates needed.");
//     //   }
  
//     } catch (error) {
//       console.error('Error during migration:', error);
//     } finally {
//       // Close the database connection
//       await mongoose.connection.close();
//     }
//   }
  
 

exports.getcustomerreport = async (req, res) => {
  try {
    // Extract pagination parameters from DataTables request
    let start = parseInt(req.query.start) || 0; // Skip records
    let length = parseInt(req.query.length) || 10; // Limit records per page
    const { fromDate, toDate,download } = req.query;

    // Extract date range from query parameters
    let startDate, endDate;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Define the common aggregation pipeline (without skip & limit)
    let basePipeline = [
      // Match customers based on search criteria
      {
        $match: {
          $or: [
            { name: { $regex: req.query.search?.value || "", $options: "i" } },
            { location: { $regex: req.query.search?.value || "", $options: "i" } },
            { mobileNumber: { $regex: req.query.search?.value || "", $options: "i" } },
            { city: { $regex: req.query.search?.value || "", $options: "i" } },
          ],
        },
      },
      // Lookup orders for each customer
      {
        $lookup: {
          from: "orders",
          localField: "id",
          foreignField: "customerId",
          as: "orders",
        },
      },
      // Lookup recharge transactions for each customer
      {
        $lookup: {
          from: "recharges",
          localField: "id",
          foreignField: "customerId",
          as: "recharges",
        },
      },
      // Lookup customer asset history for security deposits
      {
        $lookup: {
          from: "customerassethistories",
          localField: "id",
          foreignField: "customerId",
          as: "assets",
        },
      },
      // Unwind and filter orders by date range
      { $unwind: { path: "$orders", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { "orders.createdAt": { $gte: startDate, $lte: endDate } },
            { orders: null }, // Include customers with no orders
          ],
        },
      },
      // Unwind assets without filtering by assetType
      { $unwind: { path: "$assets", preserveNullAndEmptyArrays: true } },
      // Group by customer to calculate totals
      {
        $group: {
          _id: "$id",
          name: { $first: "$name" },
          location: { $first: "$location" },
          mobileNumber: { $first: "$mobileNumber" },
          city: { $first: "$city" },
          total5galBottles: { $sum: "$orders.noOf5galBottles" },
          total200mlBottles: { $sum: "$orders.noOf200mlBottles" },
          totalPrice: { $sum: "$orders.totalPrice" },
          totalPendingPayment: {
            $sum: { $subtract: ["$orders.totalPrice", "$orders.creditAmountPaid"] },
          },
          totalRechargeAmount: { $sum: { $sum: "$recharges.amount" } },
          totalSecurityDeposit: { $sum: "$assets.securityDeposit" }, // Sum all security deposits
        },
      },
      // Final projection to format the output
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          location: 1,
          mobileNumber: 1,
          city: 1,
          total5galBottles: 1,
          total200mlBottles: 1,
          totalPendingPayment: 1,
          totalRechargeAmount: 1,
          totalSecurityDeposit: 1, // Shows sum of all deposits
          totalPrice: 1,
        },
      },
    ];

    // 1️⃣ Get the total number of filtered records
    const filteredRecords = await Customer.aggregate(basePipeline);
    const recordsFiltered = filteredRecords.length;

    // 2️⃣ Apply pagination (skip & limit) for actual data retrieval
    const reportData = await Customer.aggregate([...basePipeline, { $skip: start }, { $limit: length }]);

    // 3️⃣ Get total records count (without filters)
    const totalRecords = await Customer.countDocuments();
 
    if (download == "Yes") {
      // Convert JSON data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(reportData);

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Report");

      // Write to buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      // Set response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=salesman_report.xlsx");

      // Send file as response
      return res.send(excelBuffer);
    }
 
    res.json({
      draw: req.query.draw ? parseInt(req.query.draw) : 1,
      recordsTotal: totalRecords, // Total customers in DB
      recordsFiltered: recordsFiltered, // Total customers matching search & date filter
      data: reportData, // Paginated data
    });
  } catch (error) {
    console.error("Error fetching customer report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



 

exports.gettruckreport = async (req, res) => {
  try {
    // Extract date range from query parameters
    const { fromDate, toDate,download } = req.query;
    let startDate, endDate;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      const { startOfMonth, endOfMonth } = getCurrentMonthDateRange();
      startDate = startOfMonth;
      endDate = endOfMonth;
    }

    // Aggregate truck data with history using $lookup
    const reportData = await Truck.aggregate([
      {
        $lookup: {
          from: "truckhistories", // Collection name in MongoDB
          localField: "id",
          foreignField: "truckId",
          as: "history",
        },
      },
      {
        $unwind: {
          path: "$history",
          preserveNullAndEmptyArrays: true, // Keeps trucks without history
        },
      },
      // {
      //   $match: {
      //     $or: [
      //       { "history.createdAt": { $gte: startDate, $lte: endDate } },
      //       { history: null }, // Include trucks with no history
      //     ],
      //   },
      // },
      {
        $group: {
          _id: "$id",
          stockOf5galBottles: { $sum: "$history.stockOf5galBottles" },
          stockOf200mlBottles: { $sum: "$history.stockOf200mlBottles" },
          delivered5galBottles: { $sum: "$history.delivered5galBottles" },
          delivered200mlBottles: { $sum: "$history.delivered200mlBottles" },
          damagedbottles: { $sum: "$history.damaged5galBottles" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          stockOf5galBottles: 1,
          stockOf200mlBottles: 1,
          delivered5galBottles: 1,
          delivered200mlBottles: 1,
          damagedbottles: 1,
        },
      },
    ]);
   
    if (download == "Yes") {
      // Convert JSON data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(reportData);

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Truck Report");

      // Write to buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      // Set response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=salesman_report.xlsx");

      // Send file as response
      return res.send(excelBuffer);
    }
    res.json({ data: reportData });
  } catch (error) {
    console.error("Error fetching truck report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




exports.getcreditreport = async (req, res) => {
  try {
      const draw = parseInt(req.query.draw) || 1;
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const searchValue = req.query.search?.value || ''; 
      const regex = new RegExp(searchValue, 'i');

      const filter = searchValue ? { 
          $or: [
              { name: regex },
              { mobileNumber: regex },
              { routeId: regex }
          ]
      } : {};

      const totalRecords = await Customer.countDocuments();
      const filteredRecords = await Customer.countDocuments(filter);

      const customers = await Customer.find(filter)
          .skip(start)
          .limit(length)
          .sort({ lastOrderedAt: -1 });

      res.json({
          draw,
          recordsTotal: totalRecords,
          recordsFiltered: filteredRecords,
          data: customers
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete customer API
// router.delete('/delete-customer/:id', async (req, res) => {
//   try {
//       await Customer.findOneAndDelete({ id: req.params.id });
//       res.json({ success: true });
//   } catch (error) {
//       res.status(500).json({ success: false, error: 'Failed to delete' });
//   }
// });

exports.commissionreport = async (req, res) => {

  try {
    const { from, to, salesmanId } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    
    // Build query filter
    const queryFilter = { status: 'DELIVERED' };
    if (Object.keys(dateFilter).length > 0) {
      queryFilter.delivered_at = dateFilter;
    }
    if (salesmanId) {
      queryFilter.salesmanId = salesmanId;
    }
    
    // Get all salesmen (for dropdown)
    const salesmen = await Salesman.find({}, 'id name');
    
    // Get delivered orders in the date range
    const orders = await Order.find(queryFilter).populate('customerId', 'name');
    
    // Get all commission schemes
    const commissionSchemes = await CommissionSchema.find({});
    
    // Calculate commissions
    const commissionData = [];
    
    // Group orders by salesman
    const ordersBySalesman = {};
    orders.forEach(order => {
      if (!ordersBySalesman[order.salesmanId]) {
        ordersBySalesman[order.salesmanId] = [];
      }
      ordersBySalesman[order.salesmanId].push(order);
    });
    
    // Process each salesman's orders
    for (const [salesmanId, salesmanOrders] of Object.entries(ordersBySalesman)) {
      const salesman = await Salesman.findById(salesmanId);
      if (!salesman) continue;
      
      // Get salesman's commission schemes
      const salesmanSchemes = commissionSchemes.filter(scheme => 
        salesman.commissionschmes.includes(scheme.code)
      );
      
      // Calculate total sales
      const totalSales = salesmanOrders.reduce((sum, order) => 
        sum + order.totalPrice, 0);
      
      // Apply each commission scheme
      for (const scheme of salesmanSchemes) {
        const achievement = (totalSales / scheme.achievement) * 100;
        let baseCommission = 0;
        let incrementalBonus = 0;
        
        // Calculate base commission
        if (achievement >= 100) {
          baseCommission = totalSales * (parseFloat(scheme.benifit) / 100);
        }
        
        // Calculate incremental bonus
        if (scheme.increment && achievement > 100) {
          const overAchievement = achievement - 100;
          incrementalBonus = totalSales * (parseFloat(scheme.increment) / 100) * (overAchievement / 100);
        }
        
        commissionData.push({
          salesmanId: salesman.id,
          salesmanName: salesman.name,
          schemeCode: scheme.code,
          totalSales,
          achievement,
          baseCommission,
          incrementalBonus,
          totalCommission: baseCommission + incrementalBonus
        });
      }
    }
    
    res.render('reports/commission', { title: 'Al Qattara' ,route:'Reports',sub :'Commission Report',
      salesmen,
      commissionData,
      fromDate: from || '',
      toDate: to || '',
      selectedSalesman: salesmanId || ''
    });
    
  } catch (error) {
    console.error('Error generating commission report:', error);
    res.status(500).send('Error generating report');
  }

}