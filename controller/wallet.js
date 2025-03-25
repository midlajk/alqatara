
require('../model/database')
const mongoose = require('mongoose');

const Customer = mongoose.model('Customer')
const Recharge = mongoose.model('Recharge')
const createError = require('http-errors');
const { v4: uuidv4 } = require('uuid'); // For generating unique coupon IDs

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
          paidcoupons: 1,
          freecoupons: 1,

          updatedAt: 1
        }
      },
      { $skip: start },
      { $limit: length }
    ];

    const data = await Recharge.aggregate(pipeline);
    const totalRecords = await Recharge.countDocuments();
console.log(data)

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



exports.addwalletmoney = async (req, res) => {
  try {
    const { customerId, salesman, walletrecharge, couponagainst, freecoupons } = req.body;
    // Convert input values to numbers
    const amount = parseFloat(walletrecharge);
    const numCoupons = parseInt(couponagainst, 10);
    const numFreeCoupons = parseInt(freecoupons, 0);

    // Validate inputs
    if (!customerId || isNaN(amount) || isNaN(numCoupons) || isNaN(numFreeCoupons)) {
        return res.status(400).json({ message: 'Invalid input values' });
    }

    // Generate paid coupons
    let coupons = [];
    if (numCoupons > 0) {
        const couponAmount = amount / numCoupons; // Calculate amount per paid coupon
        for (let i = 0; i < numCoupons; i++) {
            coupons.push({
                couponid: 'P-'+uuidv4(), // Unique ID for each coupon
                couponamt: couponAmount,
                coupontype: 'PAID',
                created: new Date(),
                status: 'ACTIVE'
            });
        }
    }

    // Generate free coupons with amount 0
    if (numFreeCoupons > 0) {
        for (let i = 0; i < numFreeCoupons; i++) {
            coupons.push({
                couponid: 'F-'+uuidv4(),
                couponamt: 0,
                coupontype: 'FREE',
                created: new Date(),
                status: 'ACTIVE'
            });
        }
    }
      console.log(numCoupons,numFreeCoupons)
    // Create a new recharge entry
    const recharge = new Recharge({
        amount,
        customerId,
        salesmanId: salesman,
        paidcoupons:numCoupons,
        freecoupons:numFreeCoupons,
        coupons,
    });

    // Save to database
    await recharge.save();

    // res.redirect('/wallet')
} catch (error) {
    console.error('Error processing wallet recharge:', error);
    res.status(500).json({ message: 'Internal Server Error' });
}
};
