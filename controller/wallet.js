
require('../model/database')
const mongoose = require('mongoose');

const Customer = mongoose.model('Customer')
const Recharge = mongoose.model('Recharge')

exports.getrecharges = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1; // DataTables draw count
    const start = parseInt(req.query.start) || 0; // Start index for pagination
    const length = parseInt(req.query.length) || 10; // Number of records to fetch
    const searchValue = req.query.search?.value || ''; // Search value
    const regex = new RegExp(searchValue, 'i'); // Regex for search

    const pipeline = [
      {
        $lookup: {
          from: 'customers', // Ensure correct collection name (lowercase and plural)
          localField: 'customerId',
          foreignField: 'id', // Use '_id' instead of 'id'
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true // Allows records without a matching customer
        }
      },
      {
        $match: {
          $or: [
            { 'customer.name': regex }, // Search in customer name
            { salesmanId: regex },
            { status: regex }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          'customer.name': 1,
          customerId: 1,
          salesmanId: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $skip: start },
      { $limit: length }
    ];

    const data = await Recharge.aggregate(pipeline);
    const totalRecords = await Recharge.countDocuments();

    console.log('Fetched Recharges:', data); // Debugging Output

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching recharges:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
