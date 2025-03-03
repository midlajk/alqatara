
require('../model/database')
const mongoose = require('mongoose');
const Customer = mongoose.model('Customer')
const Order = mongoose.model('Order')
const DeletedCustomer = mongoose.model('DeletedCustomer')
const moment = require('moment');
const createError = require('http-errors');

exports.getdatas = async (req, res) => {
try {
    const { city, truck, fromDate, toDate } = req.query;

    // Default to current month if no date is provided
    const startDate = fromDate || moment().startOf('month').format('YYYY-MM-DD');
    const endDate = toDate || moment().endOf('month').format('YYYY-MM-DD');

    // Build filters for queries
    const filters = { updatedAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    // if (city && city !== 'All') filters.city = city;
    if (truck && truck !== 'All') filters.truckId = truck;

    // Aggregate Orders Data: Sum delivered orders & number of credit sales
    const orders = await Order.aggregate([
      { $match: { status: 'DELIVERED', ...filters } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          totalCreditSales: { $sum: { $cond: [{ $eq: ['$isCredit', true] }, 1, 0] } }
        }
      }
    ]);

    // Aggregate Registered Customers: Count customers within the filtered date range
    const registeredCustomersCount = await Customer.countDocuments({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    // Aggregate Deleted Customers: Count deleted customers within the filtered date range
    const deletedCustomersCount = await DeletedCustomer.countDocuments({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    // Send the aggregated data as response
    res.json({
      deliveries: orders.length > 0 ? orders[0].totalDeliveries : 0,
      creditSales: orders.length > 0 ? orders[0].totalCreditSales : 0,
      registeredCustomers: registeredCustomersCount,
      deletedCustomers: deletedCustomersCount
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
}



function isSameMonth(fromDate, toDate) {
  const from = moment(fromDate);
  const to = moment(toDate);
  return from.isSame(to, 'month'); // Check if both dates are in the same month
}

// Endpoint to fetch sales data for the chart
exports.gettotalsaleschart = async (req, res) => {
  console.log('here')

  try {
    const { fromDate, toDate, truckId } = req.query;
    console.log(fromDate, toDate, truckId )

    // Default to current month if no date is provided
    const startDate = fromDate || moment().startOf('month').format('YYYY-MM-DD');
    const endDate = toDate || moment().endOf('month').format('YYYY-MM-DD');

    // Check if the date range is within a single month
    const sameMonth = isSameMonth(startDate, endDate);

    // Filter based on provided dates and optional truckId
    const match = { updatedAt: { $gte: new Date(fromDate), $lte: new Date(toDate) } };

    if (truckId && truckId !== 'All') match.truckId = truckId;

    let salesData;

    // If the range is within a single month, aggregate by week
    if (sameMonth) {
      salesData = await Order.aggregate([
        { $match: match },
        {
          $project: {
            week: { $week: "$updatedAt" }, // Extract week number from updatedAt
            totalPrice: 1
          }
        },
        {
          $group: {
            _id: "$week", // Group by week number
            totalSales: { $sum: "$totalPrice" }
          }
        },
        { $sort: { _id: 1 } } // Sort by week number
      ]);
    } else {
      // Aggregate by month if the range spans multiple months
      salesData = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $month: "$updatedAt" }, // Group by month
            totalSales: { $sum: "$totalPrice" }
          }
        },
        { $sort: { _id: 1 } } // Sort by month number
      ]);
    }

    // Prepare the response in a format that the frontend can use
    const labels = [];
    const data = [];

    if (sameMonth) {
      // Add weekly labels and data
      salesData.forEach(item => {
        labels.push(`Week ${item._id}`);
        data.push(item.totalSales);
      });
    } else {
      // Add monthly labels and data
      salesData.forEach(item => {
        labels.push(getMonthName(item._id)); // Convert month number to name
        data.push(item.totalSales);
      });
    }

    res.json({
      labels: labels,
      data: data
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to convert month number to name
function getMonthName(monthNumber) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return months[monthNumber - 1]; // Month is 1-indexed
}



  exports.getOrdersCount = async (req, res) => {
    console.log('here')
  try {
      const { startDate, endDate, truckId, area } = req.query;

      // Convert dates to proper format
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Determine if grouping should be weekly or monthly
      const diffInDays = (end - start) / (1000 * 60 * 60 * 24);
      const groupBy = diffInDays > 7 ? '%Y-%m' : '%Y-%U'; // Month-wise or week-wise

      const matchStage = {
          $match: {
              createdAt: { $gte: start, $lte: end }
          }
      };

      if (truckId) matchStage.$match.truckId = truckId;
      if (area) matchStage.$match.area = area;

      const pipeline = [
          matchStage,
          {
              $group: {
                  _id: { $dateToString: { format: groupBy, date: "$createdAt" } },
                  totalOrders: { $sum: 1 }
              }
          },
          { $sort: { _id: 1 } } // Sorting by time
      ];

      const result = await Order.aggregate(pipeline);

      res.json(result);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
  }
};