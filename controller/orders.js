
require('../model/database')
const mongoose = require('mongoose');
const Truck = mongoose.model('Truck')
const Order = mongoose.model('Order')
const CreditOrderHistory = mongoose.model('CreditOrderHistory')


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



// Fetch orders for a specific salesman or truck
exports.assignedorders= async (req, res) => {
    try {
        const { salesmanId, truckId } = req.query;
        let query = {};

        if (salesmanId) query.salesmanId = salesmanId;
        if (truckId) query.truckId = truckId;

        const orders = await Order.find(query);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal Server Error" });
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

  const id = req.params.id
  const order = await Order.findById(id)
  console.log(order)
  res.render('order/orderhistory', { title: 'Al Qattara',route:'Orders',sub :'Order History',order:order });


  

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
    const {_id, id, delivered_at, assistants, ...updateData } = req.body;
    console.log(delivered_at)

    // Ensure delivered_at is a proper Date object
    if (delivered_at) {
      updateData.delivered_at = new Date(delivered_at);
    }

    // Ensure assistants is stored as an array
    if (assistants) {
      updateData.assistants = Array.isArray(assistants) ? assistants : [assistants];
    }

    // Update the order in the database
    const updatedOrder = await Order.findByIdAndUpdate({ _id }, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the data follows schema rules
    });
    console.log(updatedOrder)

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.redirect('/orderhistory/'+_id);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Error updating order" });
  }
};

exports.addpayments = async (req, res) => {

try {
  const { orderId, paymentDate, modeOfPayment, amountpaid } = req.body;
  console.log(req.body)

    const payment = new CreditOrderHistory({
      orderId:orderId,
      createdAt:new Date(),
      updatedAt:new Date(paymentDate),
      modeOfPayment:modeOfPayment,
      creditAmountPaid:amountpaid,
      totalCreditAmountDue:0
    });
    await payment.save();

  // Find the order and update payment details

  res.json({ success: true, message: "Payment added successfully", payment });
} catch (error) {
  console.error("Error adding payment:", error);
  res.status(500).json({ success: false, message: "Server error" });
}
}