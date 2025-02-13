
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const DeletedCustomer  = mongoose.model('DeletedCustomer')

const Customer = mongoose.model('Customer')

exports.getcustomer = async (req, res) => {
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
    exports.newcustomer = async (req, res) => {
      console.log('here')
 
      try {
        const cutomer = new Customer(req.body);
        await cutomer.save();
        res.redirect('/customers');
    } catch (error) {
      console.log(error)
        res.status(400).send({ error: error.message });
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
    const { id, noOf5galBottles, bottleSecurityDeposit, noOfCoolers, coolerSecurityDeposit, walletBalance, collectedMoney, bottleLendType, coolerLendType } = req.body;

    // Find the customer first
    const customer = await Customer.findOne({ id:id });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Object to hold numeric updates (add to existing values)
    const updateNumbers = {};
    if (noOf5galBottles) updateNumbers.noOf5galBottles = parseInt(noOf5galBottles);
    if (bottleSecurityDeposit) updateNumbers.bottleSecurityDeposit = parseFloat(bottleSecurityDeposit);
    if (noOfCoolers) updateNumbers.noOfCoolers = parseInt(noOfCoolers);
    if (coolerSecurityDeposit) updateNumbers.coolerSecurityDeposit = parseFloat(coolerSecurityDeposit);
    if (walletBalance) updateNumbers.walletBalance = parseFloat(walletBalance);
    if (collectedMoney) updateNumbers.collectedMoney = parseFloat(collectedMoney);

    // Object to hold string updates (replace existing values)
    const updateStrings = {};
    if (bottleLendType) updateStrings.bottleLendType = bottleLendType;
    if (coolerLendType) updateStrings.coolerLendType = coolerLendType;

    // Perform the update using $inc for numbers and $set for strings
    const updatedCustomer = await Customer.findOneAndUpdate(
      { id },
      { 
        ...(Object.keys(updateNumbers).length > 0 && { $inc: updateNumbers }),
        ...(Object.keys(updateStrings).length > 0 && { $set: updateStrings }),
        $set: { updatedAt: new Date() } // Always update timestamp
      },
      { new: true }
    );

    res.status(200).json({ message: "Customer updated successfully", updatedCustomer });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Error updating customer", error });
  }
}



exports.dailycustomer = async (req, res) => {

  try {
    const { routeId } = req.params;
    // Get today's day (e.g., "WEDNESDAY")
    const today = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
    const customers = await Customer.find({
      routeId,
      deliveryDay: today, // Match today's day
    });
console.log(customers)
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
  }
}