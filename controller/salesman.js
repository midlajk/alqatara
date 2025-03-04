
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createError = require('http-errors');

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
      if (req.session.city && req.session.city !== 'All') {
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
        const salesman = new Salesman(req.body);
        await salesman.save();
        res.redirect('/salesman');
    } catch (error) {
      return next(createError(400, error));
    }
 
  };

    
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
