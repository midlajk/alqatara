
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
const Cashier = mongoose.model("Cashier");

const secretKey = process.env.JWT_SECRET; // Access secret key
 
const Salesman = mongoose.model('Salesman')

exports.getsalesmanpayment = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const draw = parseInt(req.query.draw) || 1;

    const salesmen = await Salesman.find({}).lean();

    // Helper function to calculate totals
    const calculatePayments = (payments) => {
      return payments.reduce((acc, payment) => {
        const mode = payment.modeOfPayment || 'unknown';
        const paid = payment.creditAmountPaid || 0;
        const returned = payment.amountreturned || 0;
        const wallet = payment.paymentfor == 'Wallet Recharge'? (payment.creditAmountPaid ||0): 0;

        acc.totalCollected += paid;
        acc.totalReturned += returned;
        acc.paymentMethods[mode] = (acc.paymentMethods[mode] || 0) + paid;
        acc.wallet += wallet;

        return acc;
      }, { totalCollected: 0, totalReturned: 0, paymentMethods: {},wallet:0 });
    };

    const salesmanData = await Promise.all(salesmen.map(async (s) => {
      const payments = await Payment.find({
        salesmanid: s.id,
        createdAt: { $gte: s.lastpaymentcollected || new Date(0) }
      }).lean();

      const { totalCollected, totalReturned, paymentMethods ,wallet} = calculatePayments(payments);
      const netAmount = totalCollected - totalReturned;
      const pending = s.pendingpayment || 0;
      const total = netAmount + pending;

      return {
        salesman_id: s.id,
        name: s.name,
        today_sale: netAmount,
        cash: paymentMethods.Cash || 0,
        wallet: wallet|| 0,
        // deposit: paymentMethods.deposit || 0,
        card: paymentMethods.Card || 0,
        // recharge: paymentMethods.recharge || 0,
        can_collect: total,
        pending_amount: pending
      };
    }));

    // Sort by total collectible amount descending
    salesmanData.sort((a, b) => (b.today_sale + b.pending_amount) - (a.today_sale + a.pending_amount));

    // Pagination
    const paginated = salesmanData.slice(start, start + length);

    res.json({
      draw,
      recordsTotal: salesmanData.length,
      recordsFiltered: salesmanData.length,
      data: paginated
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
    // let query = {
    //   isCredit: true // Only credit customers
    // };
    let query = {};
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

    // Then, for each customer, find their outstanding orders
    const customerPayments = await Promise.all(customers.map(async (customer) => {
      // Find all orders for this customer with outstanding balance
      const orders = await Order.aggregate([
        { 
          $match: { 
            customerId: customer.id.toString(),
            // isCreditCustomerOrder: true,
            $expr: { $gt: [{ $subtract: ["$totalPrice", "$creditAmountPaid"] }, 0] }
          }
        },
        {
          $group: {
            _id: "$customerId",
            total_outstanding: { 
              $sum: { $subtract: ["$totalPrice", "$creditAmountPaid"] } 
            },
            last_pending: { $max: "$createdAt" },
            order_count: { $sum: 1 }
          }
        }
      ]);

      if (orders.length > 0 && orders[0].total_outstanding > 0) {
        return {
          customer_id: customer.id,
          name: customer.name,
          mobileNumber: customer.mobileNumber,
          total_due: orders[0].total_outstanding,
          last_pending: orders[0].last_pending,
          order_count: orders[0].order_count
        };
      }
      return null;
    }));

    // Filter out null values (customers with no outstanding orders)
    const filteredPayments = customerPayments.filter(payment => payment !== null);

    // Get total count for pagination
    const totalCount = await Customer.countDocuments(query);
    
    // Get filtered count (customers with actual outstanding orders)
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

  exports.collectpayments = async (req, res) => {
    try {
      const { salesman_id, amount, payment_method, notes } = req.body;
      const collectedAmount = parseFloat(amount);
  
      // 1. Save cashier collection entry
      const newPayment = new Cashier({
        salesman_id,
        amount: collectedAmount,
        payment_method,
        notes,
        collectionfrom: 'Salesman'
      });
      await newPayment.save();
  
      // 2. Find salesman
      const salesman = await Salesman.findOne({ id: salesman_id });
      if (!salesman) {
        return res.status(404).json({ error: 'Salesman not found' });
      }
  
      // 3. Get all payments since last collection
      const paymentQuery = {
        salesmanid: salesman_id,
        createdAt: { $gte: salesman.lastpaymentcollected || new Date(0) }
      };
  
      const payments = await Payment.find(paymentQuery).lean();
  
      // 4. Calculate net total
      const totals = payments.reduce((acc, p) => {
        acc.collected += p.creditAmountPaid || 0;
        acc.returned += p.amountreturned || 0;
        return acc;
      }, { collected: 0, returned: 0 });
  
      const netAmount = totals.collected - totals.returned;
  
      // 5. Calculate new pending
      const previousPending = salesman.pendingpayment || 0;
      const totalDue = previousPending + netAmount;
      const updatedPending = totalDue - collectedAmount;
  
      // 6. Update salesman
      salesman.pendingpayment = updatedPending < 0 ? 0 : updatedPending;
      salesman.lastpaymentcollected = new Date();
      await salesman.save();
  
      res.status(201).json({
        message: 'Payment collected successfully and pending updated',
        netSale: netAmount,
        previousPending,
        totalDue,
        collected: collectedAmount,
        newPending: salesman.pendingpayment
      });
    } catch (err) {
      console.error('Error collecting payment:', err);
      res.status(500).json({ error: 'Failed to collect payment' });
    }
  };
  

  exports.cashcollection = async (req, res) => {
    try {
      const fromDate = req.query.fromDate;
      const toDate = req.query.toDate;
      const salesmanId = req.query.salesmanId;
      const paymentMethod = req.query.paymentMethod;
      
      // DataTables server-side processing parameters
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const searchValue = req.query.search.value;
      const orderColumn = req.query.order[0].column;
      const orderDir = req.query.order[0].dir;
      
      // Build the query
      let query = {};
      
      // Date range filter
      if (fromDate && toDate) {
        query.updatedAt = {
          $gte: new Date(fromDate),
          $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
        };
      }
      
      // Salesman filter
      if (salesmanId) {
        query.salesman_id = salesmanId;
      }
      
      // Payment method filter
      if (paymentMethod) {
        query.payment_method = paymentMethod;
      }
      
      // Search filter
      if (searchValue) {
        query.$or = [
          { salesman_id: { $regex: searchValue, $options: 'i' } },
          { payment_method: { $regex: searchValue, $options: 'i' } },
          { collectionfrom: { $regex: searchValue, $options: 'i' } },
          { notes: { $regex: searchValue, $options: 'i' } }
        ];
      }
      
      // Get total count
      const totalRecords = await Cashier.countDocuments();
      const filteredRecords = await Cashier.countDocuments(query);
      
      // Determine sort column
      const sortColumns = ['updatedAt', 'salesman_id', 'amount', 'payment_method', 'collectionfrom', 'notes'];
      const sortColumn = sortColumns[orderColumn];
      
      // Get paginated data
      const data = await Cashier.find(query)
        .sort({ [sortColumn]: orderDir })
        .skip(start)
        .limit(length);
      
      res.json({
        draw: parseInt(req.query.draw),
        recordsTotal: totalRecords,
        recordsFiltered: filteredRecords,
        data: data
      });
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }



  exports.cashcollectionstatus = async (req, res) => {

    try {
      const fromDate = req.query.fromDate;
      const toDate = req.query.toDate;
      const salesmanId = req.query.salesmanId;
      const paymentMethod = req.query.paymentMethod;
      
      let query = {};
      
      // Date range filter
      if (fromDate && toDate) {
        query.updatedAt = {
          $gte: new Date(fromDate),
          $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
        };
      }
      
      // Salesman filter
      if (salesmanId) {
        query.salesman_id = salesmanId;
      }
      
      // Payment method filter
      if (paymentMethod) {
        query.payment_method = paymentMethod;
      }
      
      // Get all matching records
      const collections = await Cashier.find(query);
      
      // Calculate totals
      const stats = {
        total: 0,
        cash: 0,
        card: 0,
        credit: 0
      };
      
      collections.forEach(collection => {
        stats.total += collection.amount;
        
        switch(collection.payment_method.toLowerCase()) {
          case 'cash':
            stats.cash += collection.amount;
            break;
          case 'card':
            stats.card += collection.amount;
            break;
          case 'credit':
            stats.credit += collection.amount;
            break;
        }
      });
      
      res.json(stats);
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }


exports.getSalesmanCollectionsSummary = async (req, res) => {
  try {
    const salesmen = await Salesman.find({}).lean();

    // Helper function to calculate totals
    const calculatePayments = (payments) => {
      return payments.reduce((acc, payment) => {
        const mode = payment.modeOfPayment || 'unknown';
        const paid = payment.creditAmountPaid || 0;
        const returned = payment.amountreturned || 0;
        const wallet = payment.paymentfor == 'Wallet Recharge' ? (payment.creditAmountPaid || 0) : 0;

        acc.totalCollected += paid;
        acc.totalReturned += returned;
        acc.paymentMethods[mode] = (acc.paymentMethods[mode] || 0) + paid;
        acc.wallet += wallet;

        return acc;
      }, { totalCollected: 0, totalReturned: 0, paymentMethods: {}, wallet: 0 });
    };

    let totalRecievable = 0;
    let recentCollection = 0;
    let pendingPayments = 0;
    let walletRecharge = 0;

    await Promise.all(salesmen.map(async (s) => {
      const payments = await Payment.find({
        salesmanid: s.id,
        createdAt: { $gte: s.lastpaymentcollected || new Date(0) }
      }).lean();

      const { totalCollected, totalReturned, paymentMethods, wallet } = calculatePayments(payments);
      const netAmount = totalCollected - totalReturned;
      const pending = s.pendingpayment || 0;
      const total = netAmount + pending;

      totalRecievable += total;
      recentCollection += netAmount;
      pendingPayments += pending;
      walletRecharge += wallet;
    }));

    res.json({
      success: true,
      data: {
        totalRecievable,
        recentCollection,
        pendingPayments,
        walletRecharge
      }
    });
  } catch (error) {
    console.error('Error fetching salesman summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};
exports.getCustomerCreditsSummary = async (req, res) => {
  try {
    // Get all credit customers
    const creditCustomers = await Customer.countDocuments({ isCredit: true });

    // Aggregate outstanding orders
    const outstandingData = await Order.aggregate([
      {
        $match: {
          // isCreditCustomerOrder: true,
          $expr: { $gt: [{ $subtract: ["$totalPrice", "$creditAmountPaid"] }, 0] }
        }
      },
      {
        $group: {
          _id: null,
          total_due: { $sum: { $subtract: ["$totalPrice", "$creditAmountPaid"] } },
          order_count: { $sum: 1 },
          customer_count: { $addToSet: "$customerId" }
        }
      },
      {
        $project: {
          total_due: 1,
          order_count: 1,
          customer_count: { $size: "$customer_count" }
        }
      }
    ]);

    // If no outstanding orders found
    const result = outstandingData.length > 0 ? outstandingData[0] : {
      total_due: 0,
      order_count: 0,
      customer_count: 0
    };

    res.json({
      success: true,
      data: {
        total_due: result.total_due,
        pending_orders: result.order_count,
        number_of_customers: result.customer_count,
        total_credit_customers: creditCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer credits summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};
  exports.cashcollectionexport = async (req, res) => {
    try {
      const fromDate = req.query.fromDate;
      const toDate = req.query.toDate;
      const salesmanId = req.query.salesmanId;
      const paymentMethod = req.query.paymentMethod;
      
      let query = {};
      
      // Date range filter
      if (fromDate && toDate) {
        query.updatedAt = {
          $gte: new Date(fromDate),
          $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
        };
      }
      
      // Salesman filter
      if (salesmanId) {
        query.salesman_id = salesmanId;
      }
      
      // Payment method filter
      if (paymentMethod) {
        query.payment_method = paymentMethod;
      }
      
      // Get data
      const data = await Cashier.find(query).sort({ updatedAt: 1 });
      
      // Convert to CSV
      let csv = 'Date,Salesman ID,Amount,Payment Method,Collection From,Note\n';
      
      data.forEach(item => {
        csv += `"${new Date(item.updatedAt).toLocaleDateString()}","${item.salesman_id || ''}","${item.amount}","${item.payment_method || ''}","${item.collectionfrom || ''}","${item.notes || ''}"\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cashier-collections.csv');
      
      res.send(csv);
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
