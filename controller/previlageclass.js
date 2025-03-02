
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')
const createError = require('http-errors');

const PrevilageClass = mongoose.model('PrevilageClass')

exports.getclass = async (req, res) => {
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
      const [filtereddata, totalRecords, totalFiltered] = await Promise.all([
        PrevilageClass.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
        PrevilageClass.countDocuments(), // Total records count
        PrevilageClass.countDocuments(query) // Filtered records count
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
    exports.addprevilageclass = async (req, res,next) => {
 
      try {
        const previlageClass = new PrevilageClass(req.body);
        await previlageClass.save();
        res.redirect('/manageprevilages?customKey=privileges');
    } catch (error) {
               return next(createError(400, error));
       
      }
 
  };

  exports.classnames = async (req, res) => {
    try {
      const names = await PrevilageClass.find({}, { className: 1}); // Fetch only required fields
      res.json(names);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching routes');
    }

    

};