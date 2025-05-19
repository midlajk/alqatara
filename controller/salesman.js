
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createError = require('http-errors');
const Payment = mongoose.model("Payments"); 
const Recharge = mongoose.model('Recharge')

const secretKey = process.env.JWT_SECRET; // Access secret key
 
const Salesman = mongoose.model('Salesman')

exports.getsalesman = async (req, res) => {

    try {
      const { start, length, draw, search } = req.query; // Extract DataTables parameters
      const searchQuery = search && search.value ? search.value : ''; // Search value
      const limit = parseInt(length, 10) || 10; // Number of records per page
      const skip = parseInt(start, 10) || 0; // Offset
      
      // Build query with optional search
      let query = {};

      // Apply search filter if exists
      if (searchQuery) {
          query.$or = [
              { id: { $regex: searchQuery, $options: 'i' } },
              { city: { $regex: searchQuery, $options: 'i' } }
          ];
      }

      // Apply city filter if session city exists and is not "All"
      if (req.session.city && req.session.city !== 'ALL') {
          query.city = { $regex: `^${req.session.city}$`, $options: 'i' }; // Case-insensitive match for exact city name
      }
  
      // Get filtered data and total count
      const [filtereddata, totalRecords, totalFiltered] = await Promise.all([
        Salesman.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
        Salesman.countDocuments(), // Total records count
        Salesman.countDocuments(query) // Filtered records count
      ]);
  
      // Respond with DataTables-compatible JSON
      res.json({
        draw: parseInt(draw, 10) || 1, // Pass draw counter
        recordsTotal: totalRecords, // Total records in database
        recordsFiltered: totalFiltered, // Total records after filtering
        docs: filtereddata // Data for the current page
      });
    } catch (err) {
      console.error('Error fetching trucks:', err);
      res.status(500).json({ error: 'Failed to fetch trucks' });
    }
  };
  

//   app.post('/addtruck', async (req, res) => {
    exports.newsalesman = async (req, res) => {
      try {
        const { id, name, password, city, commissionschmes } = req.body;
        
        // Validate input
        if (!id || !name || !password || !city) {
            return res.status(400).send('Missing required fields');
        }
        
        // Check if salesman already exists
        const existingSalesman = await Salesman.findOne({ id });
        if (existingSalesman) {
            return res.status(400).send('Salesperson with this ID already exists');
        }
        
        // Create new salesman
        const newSalesman = new Salesman({
            id,
            name,
            password, // Note: You should hash this password before saving
            city,
            commissionschmes: Array.isArray(commissionschmes) ? commissionschmes : [commissionschmes]
        });
        
        await newSalesman.save();
        res.redirect('/schemes'); // Redirect to salespeople list
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
    }
 
  

    
  exports.salesmanids = async (req, res) => {
    try {
      const cityFilter = req.session.city; // Get city from session
  
      let query = {};
      if (cityFilter && cityFilter.toLowerCase() !== "all") {
        query = { city: cityFilter }; // Filter only salesmen from the same city
      }
  
      const salesmans = await Salesman.find(query, { id: 1, name: 1 }); // Fetch only required fields
      res.json(salesmans);
      
    } catch (err) {
      console.error("Error fetching salesmen:", err);
      res.status(500).send("Error fetching salesmen");
    }
  };
  
// API endpoint: GET /api/salesman/report/:salesmanId
    exports.salesmanreport = async (req, res) => {
  try {
    const { salesmanId } = req.params;
    const { startDate, endDate } = req.query;

    // Set default dates to today if not provided
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filterStartDate = startDate ? new Date(startDate) : today;
    filterStartDate.setHours(0, 0, 0, 0);
    
    const filterEndDate = endDate ? new Date(endDate) : today;
    filterEndDate.setHours(23, 59, 59, 999);

    // Get salesman details
    const salesman = await Salesman.findOne( {id:salesmanId} );
    if (!salesman) {
      return res.status(404).json({ error: 'Salesman not found' });
    }

    // Get all orders for the salesman in date range
    const orders = await Order.find({
      salesmanId,
      createdAt: { $gte: filterStartDate, $lte: filterEndDate }
    });

    // Get all payments for the salesman in date range
    const payments = await Payment.find({
      salesmanid: salesmanId,
      createdAt: { $gte: filterStartDate, $lte: filterEndDate }
    });

    // Get all wallet recharges for the salesman in date range
    const walletRecharges = await Recharge.find({
      salesmanid: salesmanId,
      createdAt: { $gte: filterStartDate, $lte: filterEndDate },
      paymentfor: 'wallet recharge'
    });

    // Calculate metrics
    const totalSales = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalCollection = payments.reduce((sum, payment) => sum + (payment.creditAmountPaid || 0), 0);
    const customersServiced = new Set(orders.map(order => order.customerId)).size;
    
    // Payment method breakdown
    const paymentMethods = {
      cash: 0,
      card: 0,
      wallet: 0,
      coupon: 0
    };

    payments.forEach(payment => {
      if (payment.modeOfPayment === 'cash') paymentMethods.cash += payment.creditAmountPaid;
      else if (payment.modeOfPayment === 'card') paymentMethods.card += payment.creditAmountPaid;
      else if (payment.modeOfPayment === 'wallet') paymentMethods.wallet += payment.creditAmountPaid;
      else if (payment.modeOfPayment === 'coupon') paymentMethods.coupon += payment.creditAmountPaid;
    });

    // Wallet metrics
    const totalWalletRecharge = walletRecharges.reduce((sum, recharge) => sum + (recharge.creditAmountPaid || 0), 0);
    
    // Calculate wallet sales (sum of price of redeemed coupons)
    const walletSales = orders.reduce((sum, order) => {
      const couponItems = order.order.filter(item => item.redeamedcoupons && item.redeamedcoupons.length > 0);
      const couponTotal = couponItems.reduce((itemSum, item) => itemSum + (parseFloat(item.price) || 0), 0);
      return sum + couponTotal;
    }, 0);

    // Order status counts
    const deliveredOrders = orders.filter(order => order.status === 'DELIVERED').length;
    const pendingOrders = orders.filter(order => order.status !== 'DELIVERED').length;

    // Cash in hand calculation
    const lastPaymentDate = salesman.lastpaymentcollected || new Date(0);
    const paymentsSinceLastCollection = await Payment.find({
      salesmanid: salesmanId,
      createdAt: { $gte: lastPaymentDate, $lte: filterEndDate }
    });
    
    const cashCollectedSinceLastPayment = paymentsSinceLastCollection.reduce(
      (sum, payment) => sum + (payment.creditAmountPaid || 0), 0
    );
    
    const cashInHand = (salesman.pendingpayment || 0) + cashCollectedSinceLastPayment;

    // Product category breakdown
    const productCategories = {};
    orders.forEach(order => {
      order.order.forEach(item => {
        const category = item.itemtype || 'other';
        if (!productCategories[category]) {
          productCategories[category] = {
            quantity: 0,
            totalSales: 0,
            products: {}
          };
        }
        
        productCategories[category].quantity += item.quantity || 0;
        productCategories[category].totalSales += parseFloat(item.price) || 0;
        
        if (!productCategories[category].products[item.productid]) {
          productCategories[category].products[item.productid] = {
            name: item.productname,
            quantity: 0,
            totalSales: 0,
            price: parseFloat(item.price) || 0
          };
        }
        
        productCategories[category].products[item.productid].quantity += item.quantity || 0;
        productCategories[category].products[item.productid].totalSales += parseFloat(item.price) || 0;
      });
    });

    // Format product data for response
    const formattedProductData = Object.entries(productCategories).map(([category, data]) => ({
      category,
      totalQuantity: data.quantity,
      totalSales: data.totalSales,
      products: Object.values(data.products)
    }));

    // Prepare response
    const response = {
      salesman: {
        id: salesman.id,
        name: salesman.name,
        city: salesman.city,
        cashCollectedSinceLastPayment:cashCollectedSinceLastPayment,
        lastPaymentCollected: salesman.lastpaymentcollected,
        pendingPayment: salesman.pendingpayment
      },
      dateRange: {
        start: filterStartDate,
        end: filterEndDate
      },
      summary: {
        totalSales,
        totalCollection,
        customersServiced,
        deliveredOrders,
        pendingOrders,
        cashInHand,
        pendingPayment: salesman.pendingpayment || 0
      },
      paymentMethods,
      walletMetrics: {
        totalWalletRecharge,
        walletSales
      },
      productCategories: formattedProductData
    };
    res.json(response);
  } catch (error) {
    console.log(error)
    console.log('Error fetching salesman report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/////MObile appp 



exports.salesmanlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email & password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find the salesman by email
    const salesman = await Salesman.findOne({ name:email });

    if (!salesman) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, salesman.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: salesman.id, email: salesman.email, name: salesman.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );
    salesman.tok = token; // Assuming you have a 'token' field in the Salesman schema
    await salesman.save();
    // Send login success response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: salesman.id,
        name: salesman.name,
        email: salesman.email,
        city: salesman.city,
        token:salesman.tok
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.salesmanlogintoken = async (req, res) => {
  try {
    const { token } = req.body;

    // Check if email & password are provided
    if (!token) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find the salesman by email
    const salesman = await Salesman.findOne({ tok:token });

    if (!salesman) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare entered password with stored hashed password
    // Generate JWT token

    // Send login success response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: salesman.id,
        name: salesman.name,
        email: salesman.email,
        city: salesman.city,
        token:salesman.tok
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
exports.updatesalesman = async (req, res) => {
  try {
    const { name, password, city, commissionschmes } = req.body;
    
    // Find existing salesman
    const salesman = await Salesman.findOne({ id: req.params.id });
    if (!salesman) {
      return res.status(404).send('Salesperson not found');
    }
    
    // Update only the intended fields
    if (name) salesman.name = name;
    if (city) salesman.city = city;
    if (commissionschmes) {
      salesman.commissionschmes = Array.isArray(commissionschmes) 
        ? commissionschmes 
        : [commissionschmes];
    }
    salesman.updatedAt = Date.now();
    
    // Only update password if provided (and hash it)
    if (password && password.trim() !== '') {
      salesman.password = await bcrypt.hash(password, 10);
    }
    
    // Save only the modified fields (avoid modifying deposits)
    await salesman.save({ validateModifiedOnly: true });
    
    res.redirect('/salesman');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};