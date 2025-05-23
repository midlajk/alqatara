
require('../model/database')
const mongoose = require('mongoose');
// const { Salesman } = require('../model/database');
const CouponSchema = mongoose.model('CouponSchema')
const CommissionSchema = mongoose.model('CommissionSchema')

const createError = require('http-errors');



//   app.post('/addtruck', async (req, res) => {
    exports.addOffer = async (req, res) => {
        try {
          // Extract form data
          const { code, amount, paidcoupon, freecopon,items,routes } = req.body;
          
          // Create new coupon
          const newCoupon = new CouponSchema({
            code: code,
            amount: Number(amount),
            items: items,
            routes:routes,
            paidcoupon: Number(paidcoupon),
            freecopon: Number(freecopon),
            creationdate: new Date() // This will be set to current date automatically
          });
          
          // Save to database
          await newCoupon.save();
          
          // Flash success message if you're using flash messaging
          
          // Redirect to appropriate page
          res.redirect('/offers'); // Adjust redirect path as needed
          
        } catch (error) {
          console.error('Error adding coupon:', error);
          res.redirect('/offers');
        }
      };
      
      // Controller function to get all coupons
      exports.getAllOffers = async (req, res) => {
        try {
            const draw = parseInt(req.query.draw);
            const start = parseInt(req.query.start);
            const length = parseInt(req.query.length);
            const searchValue = req.query.search.value;
            // const orderColumnIndex = req.query.order[0].column;
            // const orderDirection = req.query.order[0].dir;
            
            // Map DataTables column index to your schema fields
         
            
            // Build search query
            let query = {};
            if (searchValue) {
                query.$or = [
                    { code: { $regex: searchValue, $options: 'i' } },
                    { 'items': { $regex: searchValue, $options: 'i' } }
                ];
            }
            
            // Get total count
            const totalRecords = await CouponSchema.countDocuments();
            const filteredRecords = await CouponSchema.countDocuments(query);
            
            // Get paginated data
            const data = await CouponSchema.find(query)
                .skip(start)
                .limit(length)
                .lean();
            
            res.json({
                draw,
                recordsTotal: totalRecords,
                recordsFiltered: filteredRecords,
                data
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
      };
      exports.offerlist= async (req, res) => {
        try {
          const search = req.query.search || '';
          const regex = new RegExp(search, 'i');
      
          const coupons = await CouponSchema.find({ code: { $regex: regex } }).limit(10);
      
          res.json(coupons);
        } catch (err) {
          console.error(err);
          res.status(500).send('Error fetching coupons');
        }
      };
      exports.deleteOffer= async (req, res) => {
        try {
          const { id } = req.body;
          const deletedOffer = await CouponSchema.findByIdAndDelete(id);
          if (!deletedOffer) {
            return res.status(404).json({ success: false, message: 'Route not found' });
          }
          res.json({ success: true, message: 'Route deleted successfully' });
        } catch (error) {
          console.error("Error deleting route:", error);
          res.status(500).json({ success: false, message: 'Server error' });
        }
      
      };



      exports.addcommission = async (req, res) => {
        try {
          // Extract data from the form
          const { commissioncode, benifit, achievement, increment, products } = req.body;
      
          // Handle products: if no products selected, default to empty array
          let selectedProducts = [];
          if (products) {
            if (Array.isArray(products)) {
              selectedProducts = products;
            } else {
              // If only one product selected, it comes as a string
              selectedProducts = [products];
            }
          }
      
          // Create a new commission document
          const newCommission = new CommissionSchema({
            code: commissioncode,
            achievement: parseFloat(achievement),
            benifit: benifit,
            increment: parseFloat(increment),
            products: selectedProducts
          });
      
          // Save the commission to the database
          await newCommission.save();
      
          // Redirect with success message
          res.redirect('/salesmancommission');
        } catch (error) {
          console.error('Error adding commission:', error);
          res.redirect('/salesmancommission');
        }
      };
      
      
      exports.getAllCommission = async (req, res) => {
        try {
            const draw = parseInt(req.query.draw);
            const start = parseInt(req.query.start);
            const length = parseInt(req.query.length);
            const searchValue = req.query.search.value;
            // const orderColumnIndex = req.query.order[0].column;
            // const orderDirection = req.query.order[0].dir;
            
            // Map DataTables column index to your schema fields
         
            
            // Build search query
            let query = {};
            if (searchValue) {
                query.$or = [
                    { code: { $regex: searchValue, $options: 'i' } },
                ];
            }
            
            // Get total count
            const totalRecords = await CommissionSchema.countDocuments();
            const filteredRecords = await CommissionSchema.countDocuments(query);
            
            // Get paginated data
            const data = await CommissionSchema.find(query)
                .skip(start)
                .limit(length)
                .lean();
            
            res.json({
                draw,
                recordsTotal: totalRecords,
                recordsFiltered: filteredRecords,
                data
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
      };
      exports.deleteCommission= async (req, res) => {
        try {
          const { id } = req.body;
          const deletedcommission = await CommissionSchema.findByIdAndDelete(id);
          if (!deletedcommission) {
            return res.status(404).json({ success: false, message: 'Route not found' });
          }
          res.json({ success: true, message: 'Route deleted successfully' });
        } catch (error) {
          console.error("Error deleting route:", error);
          res.status(500).json({ success: false, message: 'Server error' });
        }
      
      };
      exports.commissionnames= async (req, res) => {

        try {
            const schemes = await CommissionSchema.find({}).select('code -_id');
            console.log(schemes)
            res.json(schemes);
        } catch (err) {
            console.error(err);
            res.status(500).json([]);
        }
    };
  