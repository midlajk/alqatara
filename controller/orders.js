
require('../model/database')
const mongoose = require('mongoose');
const Customer = mongoose.model('Customer')
const Order = mongoose.model('Order')
const CreditOrderHistory = mongoose.model('CreditOrderHistory')
const Truck = mongoose.model('Truck')
const Salesman = mongoose.model('Salesman')


exports.getorders = async (req, res) => {
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
        Order.find(query).sort({ _id: -1 }).skip(skip).limit(limit), // Fetch paginated data
        Order.countDocuments(), // Total records count
        Order.countDocuments(query) // Filtered records count
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
    exports.neworder = async (req, res) => {
       
 
      try {
        const order = new Order(req.body);
        await order.save();
        res.redirect('/orders');
    } catch (error) {
      console.log(error)
        res.status(400).send({ error: error.message });
      }
 
  };





exports.editorderpage = async (req, res) => {

  const id = req.params.id
  const order = await Order.findById(id)
  res.render('order/updateorder',  { title: 'Al Qattara',route:'Orders',sub :'Edit Orders' ,order:order});


  

};

exports.updateOrder = async (req, res) => {
  try {
      const { orderId, truckId, area, noOf5galBottles, noOf200mlBottles, route } = req.body;

      // Ensure numerical values are parsed correctly
      const updateData = {
          truckId,
          area,
          noOf5galBottles: parseInt(noOf5galBottles, 10),
          noOf200mlBottles: parseInt(noOf200mlBottles, 10),
          routeId: route,
          updatedAt: new Date(), // Update timestamp
      };

      // Find the order by ID and update it
      const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
          new: true,  // Return updated document
          upsert: false // Don't create new document if not found
      });

      if (!updatedOrder) {
          return res.status(404).send('Order not found');
      }

      res.redirect('/orders'); // Redirect to orders page after successful update
  } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).send('Failed to update order.');
  }
};



exports.orderhistory = async (req, res) => {
  try {
      const id = req.params.id;

      // Find the order by ID
      const order = await Order.findById(id);
      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      // Find the customer based on order.customerId
      const customer = await Customer.findOne({ id: order.customerId });

      // Extract priceForA5galBottle from customer if found
      const priceForA5galBottle = customer ? customer.priceForA5galBottle : null;

      // Render the view with order and priceForA5galBottle
      res.render('order/orderhistory', { 
          title: 'Al Qattara',
          route: 'Orders',
          sub: 'Order History',
          order: order,
          priceForA5galBottle: priceForA5galBottle
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.orderhistorydata = async (req, res) => {
  try {
    const { start, length, draw, search, id } = req.query; // Extract DataTables parameters
    const searchQuery = search?.value || ''; // Extract search value
    const limit = parseInt(length, 10) || 10; // Number of records per page
    const skip = parseInt(start, 10) || 0; // Offset
    // Build query: filter by ID if provided, otherwise apply search
  
    let query = {};
    if (id) {
      query.orderId = id;   // Use orderId directly as string
    } 
    
    // Otherwise, apply search filtering on orderId or modeOfPayment
    else  if (searchQuery) {
      query = {
        $or: [
          { orderId: { $regex: searchQuery, $options: 'i' } },
          { modeOfPayment: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }


    // Fetch filtered data and total count
    const [filteredHistory, totalRecords, totalFiltered] = await Promise.all([
      CreditOrderHistory.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
      CreditOrderHistory.countDocuments(), // Total records count
      CreditOrderHistory.countDocuments(query), // Filtered records count
    ]);


    // Respond with DataTables-compatible JSON
    res.json({
      draw: parseInt(draw, 10) || 1, // DataTables draw counter
      recordsTotal: totalRecords, // Total records in database
      recordsFiltered: totalFiltered, // Total records after filtering
      docs: filteredHistory, // Data for the current page
    });
  } catch (err) {
    console.error("Error fetching order history:", err);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
};

exports.deleteorder = async (req, res) => {
  try {
    const { id } = req.body;
    await Order.findByIdAndDelete(id); // Delete order from DB
    res.json({ success: true });
} catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error deleting order" });
}
  

};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { _id, id, delivered_at, assistants, priceFor5galBottle, priceFor200mlBottle, ...updateData } = req.body;

    // Ensure delivered_at is a proper Date object
    if (delivered_at) {
      updateData.delivered_at = new Date(delivered_at);
    }

    // Calculate prices
    updateData.priceFor5galBottles = parseFloat(((priceFor5galBottle || 0) * (updateData.noOf5galBottles || 0)).toFixed(2));
    updateData.priceFor200mlBottles = parseFloat(((priceFor200mlBottle || 0) * (updateData.noOf200mlBottles || 0)).toFixed(2));

    // Ensure assistants is stored as an array
    if (assistants) {
      updateData.assistants = Array.isArray(assistants) ? assistants : [assistants];
    }

    // Update the order in the database
    const updatedOrder = await Order.findByIdAndUpdate(_id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the data follows schema rules
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // If the order status is DELIVERED, update the truck stock
    if (updateData.status === "DELIVERED" && updatedOrder.truckId) {
      const truckId = updatedOrder.truckId;
      const noOf5galBottles = parseInt(updatedOrder.noOf5galBottles) || 0;
      const noOf200mlBottles = parseInt(updatedOrder.noOf200mlBottles) || 0;

      // Step 1: Reduce stock and increase delivered count
      await Truck.findOneAndUpdate(
        { id: truckId },
        {
          $inc: {
            remaining5galBottles: -noOf5galBottles,
            remaining200mlBottles: -noOf200mlBottles,
            delivered200mlBottles: +noOf200mlBottles,
            delivered5galBottles: +noOf5galBottles
          },
        }
      );

      // Step 2: Ensure stock values don't go negative
      await Truck.findOneAndUpdate(
        { id: truckId },
        {
          remaining5galBottles: { $gte: 0 } ? 0 : undefined,
          remaining200mlBottles: { $gte: 0 } ? 0 : undefined,
        }
      );
    }

    res.redirect("/orderhistory/" + _id);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Error updating order" });
  }
};




exports.addpayments = async (req, res) => {
  try {
      const { orderId, paymentDate, modeOfPayment, amountpaid } = req.body;

      // Find the order by ID
      const order = await Order.findOne({id:orderId});
      if (!order) {
          return res.status(404).json({ success: false, message: "Order not found" });
      }

      // Calculate new credit amount paid
      const newCreditAmountPaid = parseFloat(order.creditAmountPaid) + parseFloat(amountpaid);
      const remainingAmount = parseFloat(order.totalPrice) - newCreditAmountPaid;
      if (remainingAmount < 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Payment exceeds the total amount due. Please enter a valid amount." 
        });
    }
      // Save the new payment in CreditOrderHistory
      const payment = new CreditOrderHistory({
          orderId: orderId,
          createdAt: new Date(),
          updatedAt: new Date(paymentDate),
          modeOfPayment: modeOfPayment,
          creditAmountPaid: amountpaid,
          totalCreditAmountDue: remainingAmount.toFixed(2) // Fixed to 2 decimals
      });
      await payment.save();

      // Update the order with new credit amount paid
      const updateFields = {
        creditAmountPaid: newCreditAmountPaid.toFixed(2)
    };
    
    // If remainingAmount is zero, mark as paid
    if (remainingAmount === 0) {
        updateFields.isCreditCustomerPaid = true;
    }
    
    // Update the order with new credit amount paid and isCreditCustomerPaid if needed
    await Order.findOneAndUpdate({ id: orderId }, updateFields);

      res.json({ success: true, message: "Payment added successfully", payment });
  } catch (error) {
      console.log("Error adding payment:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
};


//// Fetch orders for a specific salesman or truck
exports.assignedorders = async (req, res) => {
  try {
      const { salesman } = req.query;
      if (!salesman) {
          return res.status(400).json({ message: "Salesman ID is required" });
      }

      // Find the truck assigned to this salesman
      const truck = await Truck.findOne({ salesmanId: salesman });

      // Build query: Match orders where status is "PENDING" AND either:
      // - The order's salesmanId matches the given salesman
      // - OR the order's truckId matches the truck._id
      const query = {
          $and: [
              { status: "PENDING" }, // Only fetch pending orders
              {
                  $or: [
                      { salesmanId: salesman },
                      truck ? { truckId: truck.id } : null
                  ]// Remove null if no truck exists
              }
          ]
      };

      // Fetch matching orders
      const orders = await Order.find(query).sort({ _id: -1 });

      res.json(orders);
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.deliveredorders = async (req, res) => {
  try {
      const { salesman } = req.query;
      if (!salesman) {
          return res.status(400).json({ message: "Salesman ID is required" });
      }

      // Find the truck assigned to this salesman
      const truck = await Truck.findOne({ salesmanId: salesman });

      // Build query: Match orders where status is "PENDING" AND either:
      // - The order's salesmanId matches the given salesman
      // - OR the order's truckId matches the truck._id
      const query = {
          $and: [
              { status: "DELIVERED" }, // Only fetch pending orders
              {
                  $or: [
                      { salesmanId: salesman },
                      truck ? { truckId: truck.id } : null
                  ] // Remove null if no truck exists
              }
          ]
      };

      // Fetch matching orders
      const orders = await Order.find(query).sort({ _id: -1 });

      res.json(orders);
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.deliveryorderapi = async (req, res) => {
  try {
    const {
      customerId,
      salesmanId,
      noOf5galBottles,
      noOf200mlBottles,
      priceFor200mlBottles,
      creditAmountPaid,
      modeOfPayment,
      totalPrice,
      status,
      name,
      orderid
    } = req.body;
     console.log(req.body)
    // Validate required fields
    if (!customerId || !salesmanId) {
      return res.status(400).json({ error: "Customer ID and Salesman ID are required" });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ error: "Total price must be greater than 0" });
    }

    if (creditAmountPaid > 0 && !modeOfPayment) {
      return res.status(400).json({ error: "Mode of payment is required when credit amount is paid" });
    }

    // Find the truck assigned to the salesman
    const truck = await Truck.findOne({ salesmanId });
    if (!truck) {
      return res.status(400).json({ error: "No truck found for the given Salesman ID" });
    }

    let order;
    if (orderid) {
      // Update existing order
      order = await Order.findOne({ id: orderid }); // ✅ FIXED: Find order by 'id' field instead of '_id'
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order fields
      Object.assign(order, {
        noOf5galBottles: noOf5galBottles ?? order.noOf5galBottles,
        noOf200mlBottles: noOf200mlBottles ?? order.noOf200mlBottles,
        priceFor200mlBottles: priceFor200mlBottles ?? order.priceFor200mlBottles,
        creditAmountPaid: creditAmountPaid ?? order.creditAmountPaid,
        modeOfPayment: modeOfPayment ?? order.modeOfPayment,
        totalPrice: totalPrice ?? order.totalPrice,
        status: status ?? order.status,
        updatedAt: new Date(), // ✅ FIX: Proper Date object
        delivered_at: new Date(), // ✅ FIX: Proper Date object
      });

      await order.save();
    } else {
      // Create a new order
      order = new Order({
        customerId,
        name,
        truckId: truck.id,
        salesmanId,
        noOf5galBottles,
        noOf200mlBottles,
        priceFor200mlBottles,
        creditAmountPaid,
        modeOfPayment,
        totalPrice,
        status: status || "PENDING",
        createdAt: new Date(), // ✅ FIX: Proper Date object
        updatedAt: new Date(), // ✅ FIX: Proper Date object
        delivered_at: new Date(), // ✅ FIX: Proper Date object
      });

      await order.save();
    }

    // Handle credit order history if payment is involved
    if (creditAmountPaid > 0) {
      const totalCreditAmountDue = totalPrice - creditAmountPaid;
      const creditOrderHistory = new CreditOrderHistory({
        orderId: order._id,
        modeOfPayment,
        creditAmountPaid,
        totalCreditAmountDue,
      });

      await creditOrderHistory.save();
    }

    return res.status(201).json({
      message: orderid ? "Order updated successfully!" : "New order created successfully!",
      order,
    });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.creditorders = async (req, res) => {
  try {
      const { salesman } = req.query;
      if (!salesman) {
          return res.status(400).json({ message: "Salesman ID is required" });
      }

      // Find the truck assigned to this salesman
      const truck = await Truck.findOne({ salesmanId: salesman });

      // Build query: Match orders where status is "PENDING" AND either:
      // - The order's salesmanId matches the given salesman
      // - OR the order's truckId matches the truck._id
      // const query = {
      //     $and: [
      //         {
      //             $or: [
      //                 { salesmanId: salesman },
      //                 truck ? { truckId: truck.id } : null
      //             ]// Remove null if no truck exists
      //         },
      //         { totalPrice: { $ne: 0 } }, // Ensures totalPrice is not zero
      //         { $expr: { $ne: ["$totalPrice", { $ifNull: ["$creditAmountPaid", 0] }] } } // Handles null creditAm
      //     ]
      // };

      // // Fetch matching orders
      // const orders = await Order.find(query);
      const query = {
        $and: [
            {
                $or: [
                    { salesmanId: salesman },
                    truck ? { truckId: truck.id } : null
                ].filter(Boolean) // Removes null values
            },
            { totalPrice: { $ne: 0 } },
            { $expr: { $ne: ["$totalPrice", { $ifNull: ["$creditAmountPaid", 0] }] } }
        ]
    };
    
    const orders = await Order.find(query).sort({ _id: -1 });

      res.json(orders);
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};