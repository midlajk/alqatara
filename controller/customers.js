
require('../model/database')
const mongoose = require('mongoose');
// const { Salesman } = require('../model/database');
const Truck = mongoose.model('Truck')
const DeletedCustomer  = mongoose.model('DeletedCustomer')
const Salesman = mongoose.model('Salesman')

const Customer = mongoose.model('Customer')
const CustomerAssetHistory = mongoose.model('CustomerAssetHistory')
const Recharge = mongoose.model('Recharge')
const createError = require('http-errors');

exports.getcustomer = async (req, res) => {
    try {
      const { start, length, draw, search } = req.query; // Extract DataTables parameters
      const searchQuery = search && search.value ? search.value : ''; // Search value
      const limit = parseInt(length, 10) || 10; // Number of records per page
      const skip = parseInt(start, 10) || 0; // Offset
      let query = {};

      // Apply search filter if exists
      if (searchQuery) {
          query.$or = [
              { id: { $regex: searchQuery, $options: 'i' } },
              { city: { $regex: searchQuery, $options: 'i' } }
          ];
      }

      // Apply city filter if session city exists and is not "All"
      if (req.session.city && req.session.city !== 'All') {
          query.city = { $regex: `^${req.session.city}$`, $options: 'i' }; // Case-insensitive match for exact city name
      }
      console.log(req.session.city)
      
      // Build query with optional search
      // const query = searchQuery
      //   ? { $or: [{ id: { $regex: searchQuery, $options: 'i' } }, { city: { $regex: searchQuery, $options: 'i' } }] }
      //   : {};
  
      // Get filtered data and total count
      const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
        Customer.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
        Customer.countDocuments(), // Total records count
        Customer.countDocuments(query) // Filtered records count
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
  exports.newcustomer = async (req, res,next) => {
    try {
      const customer = new Customer(req.body);
      await customer.save();
      res.redirect('/customers'); // Redirect to customers list on success
    } catch (error) {
      // console.error("Error creating customer:", error);
       return next(createError(400, error.message));
      
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
                ].filter(condition => condition !== null) // Remove invalid conditions
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

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    // Move customer data to DeletedCustomer collection
    await DeletedCustomer.create({ 
      ...customer, 
      customerId: customer.id, 
      customerCreatedAt: customer.createdAt, 
      customerUpdatedAt: customer.updatedAt,
      createdAt: new Date() // Timestamp for deletion
    });

    // Delete customer from main collection
    await Customer.deleteOne({ id: req.params.id });

    res.json({ success: true, message: "Customer deleted and archived successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.deletecustomersscreen = async (req, res) => {

  res.render('customers/deletedcustomers', { title: 'Al Qattara',route:'Customer',sub :'Deleted Customers' });

};



exports.getdeletedcustomers = async (req, res) => {
  try {
    const { start, length, draw, search } = req.query; // Extract DataTables parameters
    const searchQuery = search && search.value ? search.value : ''; // Search value
    const limit = parseInt(length, 10) || 10; // Number of records per page
    const skip = parseInt(start, 10) || 0; // Offset
    
    // Build query with optional search
    const query = searchQuery
      ? { $or: [{ id: { $regex: searchQuery, $options: 'i' } }, { city: { $regex: searchQuery, $options: 'i' } }] }
      : {};

    // Get filtered data and total count
    const [filteredTrucks, totalRecords, totalFiltered] = await Promise.all([
      DeletedCustomer.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
      DeletedCustomer.countDocuments(), // Total records count
      DeletedCustomer.countDocuments(query) // Filtered records count
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



exports.newcustomerapi = async (req, res) => {
  console.log(req.body)
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json({ message: "Customer added successfully!", newCustomer });
  } catch (error) {
    console.log(error)
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
}


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
    const truck = await Truck.findOne({ salesmanId:salesmanId });
    // if (!truck) {
    //   return res.status(404).json({ message: "Customer not found" });
    // }

    // Prepare numeric updates (incrementing existing values)
    const updateNumbers = {};
    if (noOf5galBottles != null) updateNumbers.noOf5galBottles = parseInt(noOf5galBottles);
    if (bottleSecurityDeposit != null) updateNumbers.bottleSecurityDeposit = parseFloat(bottleSecurityDeposit);
    if (noOfCoolers != null) updateNumbers.noOfCoolers = parseInt(noOfCoolers);
    if (coolerSecurityDeposit != null) updateNumbers.coolerSecurityDeposit = parseFloat(coolerSecurityDeposit);
    if (walletBalance != null) updateNumbers.walletBalance = parseFloat(walletBalance);
    if (collectedMoney != null) updateNumbers.collectedMoney = parseFloat(collectedMoney);

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
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    // Add a Recharge record if wallet balance is updated
    if (walletBalance != null && walletBalance > 0) {
      await Recharge.create({
        amount: walletBalance,
        customerId: customer._id,
        salesmanId,
        status: "COMPLETED"
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
        truckId:truck.id || '',
        lendType: bottleLendType || "N/A"
      });
    }
    if (noOfCoolers != null && noOfCoolers !== 0) {
      assetEntries.push({
        assetType: "COOLER",
        noOfAssets: noOfCoolers,
        securityDeposit: coolerSecurityDeposit || 0,
        customerId: id,
        salesmanId,
        truckId:truck.id || '',
        lendType: coolerLendType || "N/A"
      });
    }

    // Insert asset history if any
    if (assetEntries.length > 0) {
      await CustomerAssetHistory.insertMany(assetEntries);
    }

    res.status(200).json({ message: "Customer updated successfully", updatedCustomer });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Error updating customer", error });
  }
};



exports.dailycustomer = async (req, res) => {

  try {
    const { routeId } = req.params;
    // Get today's day (e.g., "WEDNESDAY")
    const today = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
    const customers = await Customer.find({
      routeId,
      deliveryDay: today, // Match today's day
    });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
  }
}

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
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,
          totalWalletCollected: { $sum: "$amount" }
        }
      }
    ]);

    // Sum security deposits from CustomerAssetHistory
    const assetCollection = await CustomerAssetHistory.aggregate([
      {
        $match: {
          salesmanId: salesmanId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalSecurityDepositsCollected: { $sum: "$securityDeposit" }
        }
      }
    ]);

    // Extract values or default to 0 if no records found
    const totalWalletCollected = walletCollection.length > 0 ? walletCollection[0].totalWalletCollected : 0;
    const totalSecurityDepositsCollected = assetCollection.length > 0 ? assetCollection[0].totalSecurityDepositsCollected : 0;

    // Calculate the total sum
    const totalCollection = totalWalletCollected + totalSecurityDepositsCollected;

    // Send response
    res.status(200).json({
      totalWalletCollected,
      totalSecurityDepositsCollected,
      totalCollection // Total sum of both
    });

  } catch (error) {
    console.error("Error fetching wallet and asset collection:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};