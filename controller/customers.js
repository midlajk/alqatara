require("../model/database");
const mongoose = require("mongoose");
const Customer = mongoose.model("Customer");

// const { Salesman } = require('../model/database');
const Truck = mongoose.model("Truck");
const DeletedCustomer = mongoose.model("DeletedCustomer");
const Salesman = mongoose.model("Salesman");
const axios = require("axios");
require("dotenv").config();
const smssecret = process.env.SMS_SECRET;
const CustomerAssetHistory = mongoose.model("CustomerAssetHistory");
const Recharge = mongoose.model("Recharge");
const createError = require("http-errors");
const Order = mongoose.model("Order");
const Payment = mongoose.model("Payments"); 
const XLSX = require('xlsx');
// Make sure you have registered this model
exports.getcustomer = async (req, res) => {
  try {
    const {
      start,
      length,
      draw,
      search,
      customerType,
      deliveryDay,
      lendProducts,
      productLendType,
      route,
      zone,
      orderStatus,
      fromDate,
      toDate,
      language
    } = req.query;
    const searchQuery = search && search.value ? search.value : "";
    const limit = parseInt(length, 10) || 10;
    const skip = parseInt(start, 10) || 0;
    let query = {};

    // Apply search filter if exists
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { mobileNumber: { $regex: searchQuery, $options: "i" } },
        { id: { $regex: searchQuery, $options: "i" } },
        { city: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Apply city filter if session city exists and is not "All"
    if (req.session.city && req.session.city !== "ALL") {
      query.city = { $regex: `^${req.session.city}$`, $options: "i" };
    }

    // Apply customerType filter (new customers - registered in last 30 days)
    if (customerType === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }
    if(customerType === "Regular"){
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $lt: thirtyDaysAgo };
    }

    // Apply deliveryDay filter
    if (deliveryDay) {
      query.deliveryDay = deliveryDay;
    }

    // Apply route filter
    if (route) {
      query.routeId = route;
    }
    if (language) {
      console.log(language)
      query.language = language;
    }
    // Apply zone filter
    if (zone) {
      query.zoneId = zone;
    }
    // Handle order status with date range
    if (fromDate && toDate && (orderStatus === "Ordered" || orderStatus === "Not Ordered")) {
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      // Find all customer IDs who have orders in the date range
      const customersWithOrders = await Order.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).distinct('customerId');

      if (orderStatus === "Ordered") {
        // Only include customers who have orders in the date range
        query.id = { $in: customersWithOrders };
      } else if (orderStatus === "Not Ordered") {
        // Exclude customers who have orders in the date range
        query.id = { $nin: customersWithOrders };
      }
    }


    // For lendProducts filter, we need to first find customer IDs from CustomerAssetHistory
    let customerIdsFromAssets = [];
    
    // For lendProducts filter - handle multiple products with a constant lendType
    if (lendProducts && productLendType) {
      // Convert lendProducts to array if it isn't already
      const productsArray = Array.isArray(lendProducts)
        ? lendProducts
        : [lendProducts];

      // Create query conditions for each product with the constant lendType
      const assetConditions = productsArray.map((product) => ({
        assetType: product,
        lendType: productLendType, // Using the constant lendType for all products
      }));

      // Find all customer IDs that match ANY of the product conditions with the constant lendType
      const assetHistories = await CustomerAssetHistory.find({
        $and: assetConditions,
      }).distinct("customerId");

      // If no customers found with these assets, return empty result
    

      // Add customer IDs to the main query
      query.id = { $in: assetHistories };
    }

    // Get filtered data and total count
    const [filteredCustomers, totalRecords, totalFiltered] = await Promise.all([
      Customer.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(),
      Customer.countDocuments(query),
    ]);

    // Respond with DataTables-compatible JSON
    res.json({
      draw: parseInt(draw, 10) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: totalFiltered,
      docs: filteredCustomers,
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

//   app.post('/addtruck', async (req, res) => {
exports.newcustomer = async (req, res, next) => {
  try {
     const updateData = req.body;

    // Convert empty strings to null/undefined for cleaner database
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = undefined;
      }
    });

    // Handle date fields
    if (updateData.contractDate) {
      updateData.contractDate = new Date(updateData.contractDate);
    }

    // Handle checkbox fields to ensure they're boolean
    updateData.isCompany = updateData.isCompany === 'on';
    updateData.isCredit = updateData.isCredit === 'on';
    updateData.verified = updateData.verified === 'on';
    const customer = new Customer(updateData);
    await customer.save();
    res.redirect("/customers"); // Redirect to customers list on success
  } catch (error) {
    // console.error("Error creating customer:", error);
    return next(createError(400, error.message));
  }
};
exports.editcustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const updateData = req.body;

    // Convert empty strings to null/undefined for cleaner database
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = undefined;
      }
    });

    // Handle date fields
    if (updateData.contractDate) {
      updateData.contractDate = new Date(updateData.contractDate);
    }

    // Handle checkbox fields to ensure they're boolean
    updateData.isCompany = updateData.isCompany === 'on';
    updateData.isCredit = updateData.isCredit === 'on';
    updateData.verified = updateData.verified === 'on';

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return next(createError(404, 'Customer not found'));
    }

    // Optionally: Add activity log here
    // await ActivityLog.create({
    //   action: 'update',
    //   collection: 'customers',
    //   documentId: customerId,
    //   userId: req.user._id,
    //   changes: updateData
    // });

    res.redirect('/customers');
  } catch (error) {
    // Handle duplicate UID error
    if (error.code === 11000 && error.keyPattern.uid) {
      req.flash('error', 'Customer UID must be unique');
      return res.redirect(`/customers/edit/${req.params.id}`);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      req.flash('error', messages.join(', '));
      return res.redirect(`/customers/edit/${req.params.id}`);
    }

    next(createError(500, error.message));
  }
};
exports.getcustomerassets = async (req, res) => {
try {
    const { customer, draw, start, length, order, search } = req.query;
    const searchValue = search.value || '';
    const sortColumn = order[0].column;
    const sortDirection = order[0].dir;
    const sortField = req.query.columns[sortColumn].data;

    const query = {
      customerId: customer,
      $or: [
        { assetType: { $regex: searchValue, $options: 'i' } },
        { lendType: { $regex: searchValue, $options: 'i' } },
        { truckId: { $regex: searchValue, $options: 'i' } },
        { salesmanId: { $regex: searchValue, $options: 'i' } }
      ]
    };

    // Apply additional filters if provided
    if (req.query.asset) query.assetType = req.query.asset;
    if (req.query.lendtype) query.lendType = req.query.lendtype;
    if (req.query.fromDate) query.createdAt = { $gte: new Date(req.query.fromDate) };
    if (req.query.toDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(req.query.toDate);
    }

    const totalRecords = await CustomerAssetHistory.countDocuments({ customerId: customer });
    const filteredRecords = await CustomerAssetHistory.countDocuments(query);
    
    const data = await CustomerAssetHistory.find(query)
      .sort({ [sortField]: sortDirection === 'asc' ? 1 : -1 })
      .skip(parseInt(start))
      .limit(parseInt(length));

    res.json({
      draw: parseInt(draw),
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: data,
      docs: data // For DataTables compatibility
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
  exports.getcustomerassetsdashboard = async (req, res) => {
  try {
    const { customerId, fromDate, toDate } = req.query;
    
    const matchQuery = { customerId };
    if (fromDate) matchQuery.createdAt = { $gte: new Date(fromDate) };
    if (toDate) {
      matchQuery.createdAt = matchQuery.createdAt || {};
      matchQuery.createdAt.$lte = new Date(toDate);
    }

    // Get summary by asset type
    const assetSummary = await CustomerAssetHistory.aggregate([
      { $match: matchQuery },
       {
        $group: {
          _id: "$assetType",
          totalCUSTODY: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "CUSTODY"] }, "$noOfAssets", 0]
            }
          },
          totalSOLD: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "SOLD"] }, "$noOfAssets", 0]
            }
          },
          totalLEND: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "LEND"] }, "$noOfAssets", 0]
            }
          },
          totalRETURN: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "RETURN"] }, "$noOfAssets", 0]
            }
          },
          totalDeposit: { $sum: "$securityDeposit" },
          count: { $sum: 1 } // total number of records per assetType
        }
      },
      {
        $project: {
          _id: 0,
          assetType: "$_id",
          totalCUSTODY: 1,
          totalSOLD: 1,
          totalLEND: 1,
          totalRETURN: 1,
          totalDeposit: 1,
          count: 1
        }
      },
      {
        $sort: { assetType: 1 }
      }
    ]);

    // Get dashboard statistics
    const dashboardStats = await CustomerAssetHistory.aggregate([
      { $match: matchQuery},
      {
        $group: {
          _id: null,
          totalAssets: { $sum: {
              $cond: [{ $ne: ["$lendType", "RETURN"] }, "$noOfAssets", 0]
            }},
          totalSecurityDeposit: { $sum: {
              $cond: [{ $ne: ["$lendType", "RETURN"] }, "$securityDeposit", 0]
            }},
          returnedAssets: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "RETURN"] }, "$noOfAssets", 0]
            }
          },
          returnedPayment: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "RETURN"] }, "$securityDeposit", 0]
            }
          }
        }
      }

    ]);

    res.json({
      success: true,
      data: assetSummary,
      stats: dashboardStats.length > 0 ? dashboardStats[0] : {
        totalAssets: 0,
        totalSecurityDeposit: 0,
        returnedAssets: 0,
        returnedPayment: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getcustomerorders = async (req, res) => {
  try {
    const { start, length, draw, search, customer, salesmanId, fromDate, toDate, pendingPayment, status } = req.query;

    const searchQuery = search && search.value ? search.value.trim() : "";
    const limit = parseInt(length, 10) || 10;
    const skip = parseInt(start, 10) || 0;

    // Build base query
    let query = { customerId: customer };

    // Add search filter
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { area: { $regex: searchQuery, $options: "i" } },
        { truckId: { $regex: searchQuery, $options: "i" } },
        { salesmanId: { $regex: searchQuery, $options: "i" } },
        { status: { $regex: searchQuery, $options: "i" } },
        { "order.productname": { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Add additional filters
    if (salesmanId) {
      query.salesmanId = salesmanId;
    }

    if (status) {
      query.status = status;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }

    if (pendingPayment === "YES") {
      query.$expr = { $gt: [{ $subtract: ["$totalPrice", "$creditAmountPaid"] }, 0] };
    } else if (pendingPayment === "NO") {
      query.$expr = { $lte: [{ $subtract: ["$totalPrice", "$creditAmountPaid"] }, 0] };
    }

    const [orders, totalRecords, totalFiltered] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ customerId: customer }),
      Order.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = await Order.aggregate([
      { $match: query },
      { 
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: "$totalPrice" },
          totalPaid: { $sum: "$creditAmountPaid" },
        }
      },
      {
        $project: {
          totalOrders: 1,
          totalValue: { $ifNull: ["$totalValue", 0] },
          totalPaid: { $ifNull: ["$totalPaid", 0] },
          pendingPayment: { $subtract: ["$totalValue", "$totalPaid"] }
        }
      }
    ]);

    const summaryData = summary.length > 0 ? summary[0] : {
      totalOrders: 0,
      totalValue: 0,
      totalPaid: 0,
      pendingPayment: 0
    };

    res.json({
      draw: parseInt(draw, 10) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: totalFiltered,
      docs: orders,
      summary: summaryData
    });
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    res.status(500).json({ error: "Failed to fetch customer orders" });
  }
};
exports.getcustomerpayments = async (req, res) => {
  try {
    const { start, length, draw, search, customer, salesmanid, fromDate, toDate, modeofpayment } = req.query;

    const searchQuery = search && search.value ? search.value.trim() : "";
    const limit = parseInt(length, 10) || 10;
    const skip = parseInt(start, 10) || 0;

    // Build base query
    let query = { customerid: customer };

    // Add search filters
    if (searchQuery) {
      query.$or = [
        { modeOfPayment: { $regex: searchQuery, $options: "i" } },
        { salesmanid: { $regex: searchQuery, $options: "i" } },
        { orderId: { $regex: searchQuery, $options: "i" } }
      ];
    }

    // Additional filters
    if (salesmanid) {
      query.salesmanid = salesmanid;
    }
    if (modeofpayment && modeofpayment !== "ALL") {
      query.modeOfPayment = modeofpayment;
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const [payments, totalRecords, totalFiltered] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments({ customerid: customer }),
      Payment.countDocuments(query),
    ]);

    // Calculate dashboard stats
    const statsQuery = { customerid: customer };
    if (fromDate || toDate) {
      statsQuery.createdAt = {};
      if (fromDate) statsQuery.createdAt.$gte = new Date(fromDate);
      if (toDate) statsQuery.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const [totalPayments, walletRecharge, cashPayment, cardPayment] = await Promise.all([
      Payment.aggregate([
        { $match: statsQuery },
        { $group: { _id: null, total: { $sum: "$creditAmountPaid" } } }
      ]),
      Payment.aggregate([
        { $match: { ...statsQuery, paymentfor: "Wallet Recharge" } },
        { $group: { _id: null, total: { $sum: "$creditAmountPaid" } } }
      ]),
      Payment.aggregate([
        { $match: { ...statsQuery, modeOfPayment: "Cash" } },
        { $group: { _id: null, total: { $sum: "$creditAmountPaid" } } }
      ]),
      Payment.aggregate([
        { $match: { ...statsQuery, modeOfPayment: "Card" } },
        { $group: { _id: null, total: { $sum: "$creditAmountPaid" } } }
      ])
    ]);

    res.json({
      draw: parseInt(draw, 10) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: totalFiltered,
      docs: payments,
      stats: {
        totalPayments: totalPayments[0]?.total || 0,
        walletRecharge: walletRecharge[0]?.total || 0,
        cashPayment: cashPayment[0]?.total || 0,
        cardPayment: cardPayment[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Error fetching customer payments:", err);
    res.status(500).json({ error: "Failed to fetch customer payments" });
  }
};

exports.customerids = async (req, res) => {
  try {
    const search = req.query.search || ""; // Search input from frontend
    const customerId = req.query.customerId || ""; // If customerId is provided
    const customerName = req.query.customerName || ""; // If customerName is provided

    let query = {};

    if (customerId) {
      query.id = Number(customerId); // Ensure it's a number
    } else if (customerName) {
      query.name = { $regex: new RegExp(customerName, "i") }; // Find by name (case-insensitive)
    } else if (search) {
      query = {
        $or: [
          { name: { $regex: new RegExp(search, "i") } }, // Match customer name
          { id: isNaN(search) ? null : Number(search) }, // Match exact numeric ID
        ].filter((condition) => condition !== null), // Remove invalid conditions
      };
    }

    const customers = await Customer.find(query).limit(10);
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deletecustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id }).lean(); // Fetch customer data

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    // Move customer data to DeletedCustomer collection
    await DeletedCustomer.create({
      ...customer,
      customerId: customer.id,
      customerCreatedAt: customer.createdAt,
      customerUpdatedAt: customer.updatedAt,
      createdAt: new Date(), // Timestamp for deletion
    });

    // Delete customer from main collection
    await Customer.deleteOne({ id: req.params.id });

    res.json({
      success: true,
      message: "Customer deleted and archived successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deletecustomersscreen = async (req, res) => {
  res.render("customers/deletedcustomers", {
    title: "Al Qattara",
    route: "Customer",
    sub: "Deleted Customers",
  });
};

exports.getdeletedcustomers = async (req, res) => {
  try {
    const { start, length, draw, search } = req.query; // Extract DataTables parameters
    const searchQuery = search && search.value ? search.value : ""; // Search value
    const limit = parseInt(length, 10) || 10; // Number of records per page
    const skip = parseInt(start, 10) || 0; // Offset

    // Build query with optional search
    const query = searchQuery
      ? {
          $or: [
            { id: { $regex: searchQuery, $options: "i" } },
            { city: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    // Get filtered data and total count
    const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
      DeletedCustomer.find(query).sort({ _id: -1 }).skip(skip).limit(limit), // Fetch paginated data
      DeletedCustomer.countDocuments(), // Total records count
      DeletedCustomer.countDocuments(query), // Filtered records count
    ]);

    // Respond with DataTables-compatible JSON
    res.json({
      draw: parseInt(draw, 10) || 1, // Pass draw counter
      recordsTotal: totalRecords, // Total records in database
      recordsFiltered: totalFiltered, // Total records after filtering
      docs: filteredTrucks, // Data for the current page
    });
  } catch (err) {
    console.error("Error fetching trucks:", err);
    res.status(500).json({ error: "Failed to fetch trucks" });
  }
};

exports.newcustomerapi = async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res
      .status(201)
      .json({ message: "Customer added successfully!", newCustomer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding customer", error });
  }
};

exports.customerdetails = async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updatecustomer = async (req, res) => {
  try {
    const {
      id,
      noOf5galBottles,
      bottleSecurityDeposit,
      noOfCoolers,
      coolerSecurityDeposit,
      walletBalance,
      collectedMoney,
      bottleLendType,
      coolerLendType,
      salesmanId,
    } = req.body;

    // Find the customer
    const customer = await Customer.findOne({ id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const truck = await Truck.findOne({ salesmanId: salesmanId });
    // if (!truck) {
    //   return res.status(404).json({ message: "Customer not found" });
    // }

    // Prepare numeric updates (incrementing existing values)
    const updateNumbers = {};
    if (noOf5galBottles != null)
      updateNumbers.noOf5galBottles = parseInt(noOf5galBottles);
    if (bottleSecurityDeposit != null)
      updateNumbers.bottleSecurityDeposit = parseFloat(bottleSecurityDeposit);
    if (noOfCoolers != null) updateNumbers.noOfCoolers = parseInt(noOfCoolers);
    if (coolerSecurityDeposit != null)
      updateNumbers.coolerSecurityDeposit = parseFloat(coolerSecurityDeposit);
    if (walletBalance != null)
      updateNumbers.walletBalance = parseFloat(walletBalance);
    if (collectedMoney != null)
      updateNumbers.collectedMoney = parseFloat(collectedMoney);

    // Prepare string updates (replacing existing values)
    const updateStrings = {};
    if (bottleLendType) updateStrings.bottleLendType = bottleLendType;
    if (coolerLendType) updateStrings.coolerLendType = coolerLendType;

    // Update customer document
    const updatedCustomer = await Customer.findOneAndUpdate(
      { id },
      {
        ...(Object.keys(updateNumbers).length > 0 && { $inc: updateNumbers }),
        ...(Object.keys(updateStrings).length > 0 && { $set: updateStrings }),
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    // Add a Recharge record if wallet balance is updated
    if (walletBalance != null && walletBalance > 0) {
      await Recharge.create({
        amount: walletBalance,
        customerId: customer._id,
        salesmanId,
        status: "COMPLETED",
      });
    }

    // Add CustomerAssetHistory records if assets are updated
    const assetEntries = [];
    if (noOf5galBottles != null && noOf5galBottles !== 0) {
      assetEntries.push({
        assetType: "BOTTLE",
        noOfAssets: noOf5galBottles,
        securityDeposit: bottleSecurityDeposit || 0,
        customerId: id,
        salesmanId,
        truckId: truck.id || "",
        lendType: bottleLendType || "N/A",
      });
    }
    if (noOfCoolers != null && noOfCoolers !== 0) {
      assetEntries.push({
        assetType: "COOLER",
        noOfAssets: noOfCoolers,
        securityDeposit: coolerSecurityDeposit || 0,
        customerId: id,
        salesmanId,
        truckId: truck.id || "",
        lendType: coolerLendType || "N/A",
      });
    }

    // Insert asset history if any
    if (assetEntries.length > 0) {
      await CustomerAssetHistory.insertMany(assetEntries);
    }

    res
      .status(200)
      .json({ message: "Customer updated successfully", updatedCustomer });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Error updating customer", error });
  }
};

exports.dailycustomer = async (req, res) => {
  try {
    const { routeId } = req.params;
    // Get today's day (e.g., "WEDNESDAY")
    const today = new Date()
      .toLocaleString("en-US", { weekday: "long" })
      .toUpperCase();
    const customers = await Customer.find({
      routeId,
      deliveryDay: today, // Match today's day
    });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
  }
};

exports.getwalletandassetcollection = async (req, res) => {
  try {
    const { salesmanId } = req.query;

    if (!salesmanId) {
      return res.status(400).json({ error: "Salesman ID is required" });
    }

    // Get start and end of the current day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Sum wallet collections from Recharge
    const walletCollection = await Recharge.aggregate([
      {
        $match: {
          salesmanId: salesmanId,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          totalWalletCollected: { $sum: "$amount" },
        },
      },
    ]);

    // Sum security deposits from CustomerAssetHistory
    const assetCollection = await CustomerAssetHistory.aggregate([
      {
        $match: {
          salesmanId: salesmanId,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalSecurityDepositsCollected: { $sum: "$securityDeposit" },
        },
      },
    ]);

    // Extract values or default to 0 if no records found
    const totalWalletCollected =
      walletCollection.length > 0
        ? walletCollection[0].totalWalletCollected
        : 0;
    const totalSecurityDepositsCollected =
      assetCollection.length > 0
        ? assetCollection[0].totalSecurityDepositsCollected
        : 0;

    // Calculate the total sum
    const totalCollection =
      totalWalletCollected + totalSecurityDepositsCollected;

    // Send response
    res.status(200).json({
      totalWalletCollected,
      totalSecurityDepositsCollected,
      totalCollection, // Total sum of both
    });
  } catch (error) {
    console.error("Error fetching wallet and asset collection:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// OTP Expiry Time (e.g., 5 minutes)
const OTP_EXPIRY_TIME = 5 * 60 * 1000;

exports.generateotplink = async (req, res) => {
  try {
    const { customerId, creditAmountPaid } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "id is required" });
    }

    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_TIME); // Set expiry time

    // Update customer with OTP
    customer.otp = otp;
    customer.otpExpiresAt = otpExpiresAt;
    await customer.save();

    // Send OTP via SMS
    const response = await axios.get(
      "https://smartsmsgateway.com/api/api_http.php",
      {
        params: {
          username: "qatrawtr",
          password: smssecret,
          senderid: "QATTARAWATR",
          to: customer.mobileNumber,
          text: `Your OTP code for wallet use of AED ${creditAmountPaid} is ${otp}. It will expire in 5 minutes.`,
          type: "text",
        },
      }
    );

    console.log(response);

    res.status(200).json({ message: "OTP sent successfully", otp }); // Remove otp from response in production
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};





///////////////////////////////


const excel = require('exceljs');

exports.exportCustomers = async (req, res) => {
  try {
    // Get all the filter parameters from query
    const {
      search,
      customerType,
      deliveryDay,
      lendProducts,
      productLendType,
      route,
      zone,
      orderStatus,
      fromDate,
      toDate,
    } = req.query;
    
    const searchQuery = search && search.value ? search.value : "";
    let query = {};

    // Apply the same filters as in getcustomer
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { mobileNumber: { $regex: searchQuery, $options: "i" } },
        { id: { $regex: searchQuery, $options: "i" } },
        { city: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (req.session.city && req.session.city !== "ALL") {
      query.city = { $regex: `^${req.session.city}$`, $options: "i" };
    }

    if (customerType === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }
    if (customerType === "Regular") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $lt: thirtyDaysAgo };
    }

    if (deliveryDay) {
      query.deliveryDay = deliveryDay;
    }

    if (route) {
      query.routeId = route;
    }

    if (zone) {
      query.zoneId = zone;
    }

    // Handle order status with date range
    if (fromDate && toDate && (orderStatus === "Ordered" || orderStatus === "Not Ordered")) {
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      const customersWithOrders = await Order.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).distinct('customerId');

      if (orderStatus === "Ordered") {
        query.id = { $in: customersWithOrders };
      } else if (orderStatus === "Not Ordered") {
        query.id = { $nin: customersWithOrders };
      }
    }

    // Handle lend products filter
    if (lendProducts && productLendType) {
      const productsArray = Array.isArray(lendProducts) ? lendProducts : [lendProducts];
      const assetConditions = productsArray.map((product) => ({
        assetType: product,
        lendType: productLendType,
      }));

      const assetHistories = await CustomerAssetHistory.find({
        $and: assetConditions,
      }).distinct("customerId");

      query.id = query.id ? { $in: query.id.$in.filter(id => assetHistories.includes(id)) } : { $in: assetHistories };
    }

    // Get all customers matching the filters (no pagination)
    const customers = await Customer.find(query).sort({ _id: -1 });

    // Create Excel workbook
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Delivery Day', key: 'deliveryDay', width: 15 },
      { header: 'Route ID', key: 'routeId', width: 15 },
      { header: 'Zone ID', key: 'zoneId', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Last Ordered', key: 'lastOrderedAt', width: 20 },
      { header: '5 Gallon Bottles', key: 'noOf5galBottles', width: 15 },
      { header: 'Coolers', key: 'noOfCoolers', width: 10 },
      { header: 'Is Credit', key: 'isCredit', width: 10 },
      { header: 'Wallet Balance', key: 'walletBalance', width: 15 }
    ];

    // Add data rows
    const data = customers.map(customer => ({
      'ID': customer.id,
      'Name': customer.name,
      'Mobile Number': customer.mobileNumber,
      'Address': customer.address,
      'City': customer.city,
      'Delivery Day': customer.deliveryDay,
      'Route ID': customer.routeId,
      'Zone ID': customer.zoneId,
      'Created At': customer.createdAt,
      'Last Ordered': customer.lastOrderedAt,
      '5 Gallon Bottles': customer.noOf5galBottles,
      'Coolers': customer.noOfCoolers,
      'Is Credit': customer.isCredit ? 'Yes' : 'No',
      'Wallet Balance': customer.walletBalance
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    // Generate the Excel file buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=customers.xlsx'
    );

    // Send the Excel file
    res.send(buf);


  } catch (err) {
    console.error("Error exporting customers:", err);
    res.status(500).json({ error: "Failed to export customers" });
  }
};

exports.gettassetdetailssummary = async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: "customerId is required" });
    }

    const summary = await CustomerAssetHistory.aggregate([
      { $match: { customerId } },
      {
        $group: {
          _id: "$assetType",
          totalCUSTODY: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "CUSTODY"] }, "$noOfAssets", 0]
            }
          },
          totalSOLD: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "SOLD"] }, "$noOfAssets", 0]
            }
          },
          totalLEND: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "LEND"] }, "$noOfAssets", 0]
            }
          },
          totalRETURN: {
            $sum: {
              $cond: [{ $eq: ["$lendType", "RETURN"] }, "$noOfAssets", 0]
            }
          },
          totalDeposit: { $sum: "$securityDeposit" },
          count: { $sum: 1 } // total number of records per assetType
        }
      },
      {
        $project: {
          _id: 0,
          assetType: "$_id",
          totalCUSTODY: 1,
          totalSOLD: 1,
          totalLEND: 1,
          totalRETURN: 1,
          totalDeposit: 1,
          count: 1
        }
      },
      {
        $sort: { assetType: 1 }
      }
    ]);
    console.log(summary)

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("Error fetching asset summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




exports.getcustomerrechargeB = async (req, res) => {
  try {
    const customerId = req.query.customer;
    
    // DataTables parameters
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue = req.query.search.value;
    const orderColumn = req.query.order[0].column;
    const orderDir = req.query.order[0].dir;
    
    // Build query
    let query = { customerId };
    
    // Add search filter if needed
    if (searchValue) {
      query.$or = [
        { rechargeId: { $regex: searchValue, $options: 'i' } },
        { item: { $regex: searchValue, $options: 'i' } },
        { 'routes': { $regex: searchValue, $options: 'i' } }
      ];
    }
    
    // Get total count
    const totalCount = await Recharge.countDocuments({ customerId });
    
    // Get filtered count
    const filteredCount = await Recharge.countDocuments(query);
    
    // Determine sort field
    const sortField = 
      orderColumn === 0 ? 'updatedAt' :
      orderColumn === 1 ? 'rechargeId' :
      orderColumn === 2 ? 'salesmanId' :
      orderColumn === 3 ? 'routes' : 'updatedAt';
    
    // Fetch data
    const data = await Recharge.find(query)
      .sort({ [sortField]: orderDir === 'asc' ? 1 : -1 })
      .skip(start)
      .limit(length)
      .lean();
    
    // Calculate coupon stats
    const enrichedData = data.map(item => {
      const totalCoupons = (item.paidcoupons || 0) + (item.freecoupons || 0);
      const usedCoupons = item.coupons ? item.coupons.filter(c => c.status === 'USED').length : 0;
      const balanceCoupons = totalCoupons - usedCoupons;
      
      return {
        ...item,
        totalCoupons,
        usedCoupons,
        balanceCoupons
      };
    });
    
    res.json({
      draw: parseInt(req.query.draw),
      recordsTotal: totalCount,
      recordsFiltered: filteredCount,
      data: enrichedData
    });
    
  } catch (error) {
    console.error('Error fetching recharge data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Get wallet recharge summary for dashboard cards
exports.getWalletRechargeSummary = async (req, res) => {
  try {
    const { 
      customer,
      salesman,
      product,
      offer,
      balance,
      fromDate,
      toDate
    } = req.query;
    // Build the filter object
    const filter = {};
    
    if (customer) filter.customerId = customer;
    if (salesman) filter.salesmanId = salesman;
    if (product) filter.item = product;
    if (offer) filter.offer = offer;
    console.log(filter)
    
    // Date range filter
    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }
    
    // Find matching recharges
    const recharges = await Recharge.find(filter);

    // Calculate summary statistics
    let totalRechargedCoupons = 0;
    let totalCouponValue = 0;
    let totalRedeemedCoupons = 0;
    let totalBalanceCoupons = 0;

    recharges.forEach(recharge => {
      // Total coupons (paid + free)
      const totalCoupons = (recharge.paidcoupons || 0) + (recharge.freecoupons || 0);
      totalRechargedCoupons += totalCoupons;
      
      // Total coupon value (amount paid)
      totalCouponValue += recharge.amount || 0;
      
      // Count redeemed coupons (status USED or CLAIMED)
      const redeemed = recharge.coupons.filter(c => 
        c.status === 'USED' || c.status === 'CLAIMED'
      ).length;
      totalRedeemedCoupons += redeemed;
      
      // Balance coupons (total - redeemed)
      totalBalanceCoupons += totalCoupons - redeemed;
    });
console.log(totalRechargedCoupons,totalCouponValue,totalRedeemedCoupons,totalBalanceCoupons)
    res.status(200).json({
      success: true,
      data: {
        rechargedCoupons: totalRechargedCoupons,
        couponValue: totalCouponValue,
        redeemedCoupons: totalRedeemedCoupons,
        balanceCoupons: totalBalanceCoupons
      }
    });

  } catch (error) {
    console.error("Error getting wallet recharge summary:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};
// Get filtered wallet recharge data for table
exports.getcustomerrecharge = async (req, res) => {
  try {
    const { 
      customer,
      salesman,
      product,
      offer,
      balance,
      fromDate,
      toDate,
      start = 0,
      length = 10,
      searchValue = '',
      draw = 1
    } = req.query;

    // Build the filter object
    const filter = {};
    
    if (customer) filter.customerId = customer;
    if (salesman) filter.salesmanId = salesman;
    if (product) filter.item = product;
    if (offer) filter.offer = offer;
    
    // Balance coupon filter
    if (balance === 'Yes') {
      filter.$expr = { $gt: ['$totalCoupons', '$redeemedCoupons'] };
    } else if (balance === 'No') {
      filter.$expr = { $lte: ['$totalCoupons', '$redeemedCoupons'] };
    }
    
    // Date range filter
    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }
    
    // Search filter
    if (searchValue) {
      filter.$or = [
        { rechargeId: { $regex: searchValue, $options: 'i' } },
        { salesmanId: { $regex: searchValue, $options: 'i' } },
        { item: { $regex: searchValue, $options: 'i' } },
        { offer: { $regex: searchValue, $options: 'i' } }
      ];
    }

    // Get total count
    const totalRecords = await Recharge.countDocuments({ customerId: customer });
    
    // Get filtered count
    const filteredRecords = await Recharge.countDocuments(filter);
    
    // Get paginated data
    const data = await Recharge.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(start))
      .limit(parseInt(length))
      .lean();

    // Format data for DataTables
    const formattedData = data.map(recharge => ({
      _id: recharge._id,
      updatedAt: recharge.updatedAt,
      rechargeId: recharge.rechargeId,
      salesmanId: recharge.salesmanId,
      routes: recharge.routes || [],
      item: recharge.item,
      totalCoupons: (recharge.paidcoupons || 0) + (recharge.freecoupons || 0),
      amount: recharge.amount,
      balanceCoupons: (recharge.paidcoupons || 0) + (recharge.freecoupons || 0) - 
        recharge.coupons.filter(c => c.status === 'USED' || c.status === 'CLAIMED').length
    }));

    res.status(200).json({
      draw: parseInt(draw),
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: formattedData
    });

  } catch (error) {
    console.error("Error getting filtered wallet recharges:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};