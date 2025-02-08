
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Customer = mongoose.model('Customer')
const Salesman = mongoose.model('Salesman')

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
exports.getsalesmanreport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    // migrateSalesmanData();
    let startDate, endDate;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      // Default to current month's date range
      const { startOfMonth, endOfMonth } = getCurrentMonthDateRange();
      startDate = startOfMonth;
      endDate = endOfMonth;
    }

    // Adjust endDate to include the entire day
 

    // Fetch data within the date range
    // const aggregationPipeline = [
    //     // Unwind collectedBottleSecurityDeposits
    //     { $unwind: '$collectedBottleSecurityDeposits' },
    //     // Match documents within the date range
    //     {
    //       $match: {
    //         'collectedBottleSecurityDeposits.date': { $gte: fromDate, $lte: toDate }
    //       }
    //     },
    //     // Group by salesman id and sum the amounts
    //     {
    //       $group: {
    //         _id: '$id',
    //         totalBottleDeposits: { $sum: '$collectedBottleSecurityDeposits.amount' }
    //       }
    //     },
    //     // Unwind collectedCoolerSecurityDeposits
    //     { $unwind: '$collectedCoolerSecurityDeposits' },
    //     // Match documents within the date range
    //     {
    //       $match: {
    //         'collectedCoolerSecurityDeposits.date': { $gte: fromDate, $lte: toDate }
    //       }
    //     },
    //     // Group by salesman id and sum the amounts
    //     {
    //       $group: {
    //         _id: '$_id',
    //         totalBottleDeposits: { $first: '$totalBottleDeposits' },
    //         totalCoolerDeposits: { $sum: '$collectedCoolerSecurityDeposits.amount' }
    //       }
    //     },
    //     // Project the final result
    //     {
    //       $project: {
    //         _id: 0,
    //         id: '$_id',
    //         totalBottleDeposits: 1,
    //         totalCoolerDeposits: 1,
    //         totalDeposits: { $sum: ['$totalBottleDeposits', '$totalCoolerDeposits'] }
    //       }
    //     }
    //   ];
      
    //   const result = await Salesman.aggregate(aggregationPipeline);
    //   console.log(result)
  
  
// const aggregationPipeline = [
//     // Unwind collectedBottleSecurityDeposits
//     // { $unwind: '$collectedBottleSecurityDeposits' },
//     // // Match documents within the date range
//     // {
//     //   $match: {
//     //     'collectedBottleSecurityDeposits.date': { $gte: startDate, $lte: endDate }
//     //   }
//     // },
//     // // Group by salesman id and sum the amounts
  
//     // // // Unwind collectedCoolerSecurityDeposits
//     // { $unwind: '$collectedCoolerSecurityDeposits' },
//     // // // Match documents within the date range
//     // {
//     //   $match: {
//     //     'collectedCoolerSecurityDeposits.date': { $gte: startDate, $lte: endDate }
//     //   }
//     // },
//     // // // Group by salesman id and sum the amounts
    
//     {
//         $project: {
//           id: 1,
//           name: 1,
//           city: 1,
//           collectedBottleSecurityDeposits: 1,
//           collectedCoolerSecurityDeposits: 1
//         //   collectedBottleSecurityDeposits: {
//         //     $filter: {
//         //       input: "$collectedBottleSecurityDeposits",
//         //       as: "deposit",
//         //       cond: { $and: [
//         //         { $gte: ["$$deposit.date", startDate] },
//         //         { $lte: ["$$deposit.date", endDate] }
//         //       ]}
//         //     }
//         //   },
//         //   collectedCoolerSecurityDeposits: {
//         //     $filter: {
//         //       input: "$collectedCoolerSecurityDeposits",
//         //       as: "deposit",
//         //       cond: { $and: [
//         //         { $gte: ["$$deposit.date", startDate] },
//         //         { $lte: ["$$deposit.date", endDate] }
//         //       ]}
//         //     }
//         //   }
//         }
//       },
//       {
//         $addFields: {
//           totalBottleDeposits: { $sum: "$collectedBottleSecurityDeposits.amount" },
//           totalCoolerDeposits: { $sum: "$collectedCoolerSecurityDeposits.amount" },
//           totalCollection: { 
//             $add: [
//               { $sum: "$collectedBottleSecurityDeposits.amount" }, 
//               { $sum: "$collectedCoolerSecurityDeposits.amount" }
//             ] 
//           }
//         }
//       },
//       {
//         $project: {
//           collectedBottleSecurityDeposits: 0,
//           collectedCoolerSecurityDeposits: 0
//         }
//       }
//     // // Project the final result
//     // {
//     //   $project: {
//     //     _id: 0,
//     //     id: '$_id',
//     //     totalBottleDeposits: 1,
//     //     totalCoolerDeposits: 1,
//     //     totalDeposits: { $sum: ['$totalBottleDeposits', '$totalCoolerDeposits'] }
//     //   }
//     // }
//   ];
const aggregationPipeline = [
  {
    $project: {
      id: 1,
      name: 1,
      city: 1,
      filteredBottleSecurityDeposits: {
        $filter: {
          input: "$collectedBottleSecurityDeposits",
          as: "deposit",
          cond: {
            $and: [
              { $gte: ["$$deposit.date", startDate] },
              { $lte: ["$$deposit.date", endDate] }
            ]
          }
        }
      },
      filteredCoolerSecurityDeposits: {
        $filter: {
          input: "$collectedCoolerSecurityDeposits",
          as: "deposit",
          cond: {
            $and: [
              { $gte: ["$$deposit.date", startDate] },
              { $lte: ["$$deposit.date", endDate] }
            ]
          }
        }
      }
    }
  },
  {
    $addFields: {
      totalBottleDeposits: { $sum: "$filteredBottleSecurityDeposits.amount" },
      totalCoolerDeposits: { $sum: "$filteredCoolerSecurityDeposits.amount" },
      totalCollection: {
        $add: [
          { $sum: "$filteredBottleSecurityDeposits.amount" },
          { $sum: "$filteredCoolerSecurityDeposits.amount" }
        ]
      }
    }
  },
  {
    $project: {
      filteredBottleSecurityDeposits: 0,
      filteredCoolerSecurityDeposits: 0
    }
  }
];

  const result = await Salesman.aggregate(aggregationPipeline);
console.log(result)
 
    res.json(result);
  } catch (error) {
    console.error('Error fetching salesperson report:', error);
    res.status(500).send('Internal Server Error');
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
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue = req.query.search?.value || ""; // DataTables search input
    const regex = new RegExp(searchValue, "i");

    // Query with search filter
    const query = {
        $or: [
            { name: regex },
            { location: regex },
            { mobileNumber: regex },
            { city: regex }
        ]
    };

    // Count total records
    const totalRecords = await Customer.countDocuments();
    const filteredRecords = await Customer.countDocuments(query);

    // Fetch paginated data
    const customers = await Customer.find(query)
        .sort({ lastOrderedAt: -1 }) // Sort by recent delivery
        .skip(start)
        .limit(length);

    // Format response for DataTables
    res.json({
        draw,
        recordsTotal: totalRecords,
        recordsFiltered: filteredRecords,
        data: customers
    });
} catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
};


 

exports.gettruckreport = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue = req.query.search?.value || "";
    const regex = new RegExp(searchValue, "i");

    // Query with search filter
    const query = {
        $or: [
            { id: regex },
            { routeId: regex },
            { city: regex }
        ]
    };

    // Count total and filtered records
    const totalRecords = await Truck.countDocuments();
    const filteredRecords = await Truck.countDocuments(query);

    // Fetch paginated data
    const trucks = await Truck.find(query)
        .sort({ updatedAt: -1 }) // Sort by recent updates
        .skip(start)
        .limit(length);

    // Format response for DataTables
    res.json({
        draw,
        recordsTotal: totalRecords,
        recordsFiltered: filteredRecords,
        data: trucks
    });
} catch (error) {
    console.error("Error fetching trucks:", error);
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
