
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const createError = require('http-errors');
const Payment = mongoose.model("Payments"); 
const Customer = mongoose.model("Customer");

const secretKey = process.env.JWT_SECRET; // Access secret key
 
const Salesman = mongoose.model('Salesman')

exports.getsalesmanpayment = async (req, res) => {
    try {
      // Get pagination parameters from DataTables
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const draw = parseInt(req.query.draw) || 1;
  
      // Get all salesmen
      const salesmen = await Salesman.find({}).lean();
  
      // Process each salesman to get their payment details
      const salesmanData = await Promise.all(salesmen.map(async (salesman) => {
        // Find payments since last collected date
        const query = {
          salesmanid: salesman.id,
          createdAt: { $gte: salesman.lastpaymentcollected || new Date(0) }
        };
  
        const payments = await Payment.find(query).lean();
  
        // Calculate totals
        const totals = payments.reduce((acc, payment) => {
          acc.totalCollected += payment.creditAmountPaid;
          acc.totalReturned += payment.amountreturned || 0;
          
          // Group by payment method
          if (!acc.paymentMethods[payment.modeOfPayment]) {
            acc.paymentMethods[payment.modeOfPayment] = 0;
          }
          acc.paymentMethods[payment.modeOfPayment] += payment.creditAmountPaid;
          
          return acc;
        }, {
          totalCollected: 0,
          totalReturned: 0,
          paymentMethods: {}
        });
  
        // Calculate net amount
        const netAmount = totals.totalCollected - totals.totalReturned;
        const pendingAmount = salesman.pendingpayment || 0;
        const totalAmount = netAmount + pendingAmount;
  
        // Determine if collection should be enabled
        const canCollect = totalAmount > 0;
  
        return {
          salesman_id: salesman.id,
          name: salesman.name,
          today_sale: netAmount, // Net amount since last collection
          cash: totals.paymentMethods.cash || 0,
          wallet: totals.paymentMethods.wallet || 0,
          deposit: totals.paymentMethods.deposit || 0,
          credit: totals.paymentMethods.credit || 0,
          recharge: totals.paymentMethods.recharge || 0,
          can_collect: canCollect,
          pending_amount: pendingAmount
        };
      }));
  
      // Apply server-side pagination
      const paginatedData = salesmanData.slice(start, start + length);
      const totalRecords = salesmanData.length;
  
      // Format response for DataTables
      res.json({
        draw: draw,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: paginatedData
      });
  
    } catch (error) {
      console.error('Error fetching salesman payments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.getcustomerpayment = async (req, res) => {
    try {
      // Get pagination parameters from DataTables
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const draw = parseInt(req.query.draw) || 1;
      const searchValue = req.query.search?.value || '';
      const orderColumn = req.query.order?.[0]?.column || 0;
      const orderDir = req.query.order?.[0]?.dir || 'asc';
  
      // Build the query for customers with outstanding credit
      let query = {
        isCredit: true // Only credit customers
      };
  
      // Add search filter if search value exists
      if (searchValue) {
        query.$or = [
          { name: { $regex: searchValue, $options: 'i' } },
          { mobileNumber: { $regex: searchValue, $options: 'i' } },
          { customer_id: { $regex: searchValue, $options: 'i' } }
        ];
      }
  
      // First, get all credit customers
      const customers = await Customer.find(query)
        .skip(start)
        .limit(length)
        .lean();
  
      // Then, for each customer, find their outstanding payments
      const customerPayments = await Promise.all(customers.map(async (customer) => {
        // Find all payments for this customer where totalCreditAmountDue > 0
        const payments = await Payment.aggregate([
          { $match: { customerid: customer._id.toString() } },
          { 
            $group: {
              _id: "$customerid",
              total_due: { $sum: "$totalCreditAmountDue" },
              last_pending: { $max: "$createdAt" }
            }
          }
        ]);
  
        if (payments.length > 0 && payments[0].total_due > 0) {
          return {
            customer_id: customer._id,
            name: customer.name,
            total_due: payments[0].total_due,
            last_pending: payments[0].last_pending
          };
        }
        return null;
      }));
  
      // Filter out null values (customers with no outstanding payments)
      const filteredPayments = customerPayments.filter(payment => payment !== null);
  
      // Get total count for pagination
      const totalCount = await Customer.countDocuments(query);
      
      // Get filtered count (customers with actual outstanding payments)
      const filteredCount = filteredPayments.length;
  
      res.json({
        draw: draw,
        recordsTotal: totalCount,
        recordsFiltered: filteredCount,
        data: filteredPayments
      });
  
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };