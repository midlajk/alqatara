
require('../model/database')
const mongoose = require('mongoose');
const Customer = mongoose.model('Customer')
const Order = mongoose.model('Order')
const Payments = mongoose.model('Payments')
const Truck = mongoose.model('Truck')
const Salesman = mongoose.model('Salesman')
const axios = require('axios');
require("dotenv").config();
const smssecret = process.env.SMS_SECRET; // Access secret key
const createError = require('http-errors');
const Product = mongoose.model('Product');
const CustomerAssetHistory = mongoose.model('CustomerAssetHistory')
const Recharge = mongoose.model('Recharge')

exports.getorders = async (req, res) => {
  try {
      const { 
          start, 
          length, 
          draw, 
          search, 
          customer, 
          salesman, 
          truck, 
          status, 
          fromDate, 
          toDate 
      } = req.query;

      const searchQuery = search && search.value ? search.value : '';
      const limit = parseInt(length, 10) || 10;
      const skip = parseInt(start, 10) || 0;
      const cityFilter = req.session.city;

      // Build base query with city filter if applicable
      let baseQuery = {};
      
      if (cityFilter && cityFilter.toLowerCase() !== "all") {
          const trucksInCity = await Truck.find({ city: cityFilter }).select("id");
          const truckIds = trucksInCity.map(truck => truck.id);
          baseQuery.truckId = { $in: truckIds };
      }

      // Add search filter
      if (searchQuery) {
          baseQuery.$or = [
              { id: { $regex: searchQuery, $options: "i" } },
              { customerId: { $regex: searchQuery, $options: "i" } },
              { truckId: { $regex: searchQuery, $options: "i" } },
              { salesmanId: { $regex: searchQuery, $options: "i" } }
          ];
      }

      // Add customer filter
      if (customer) {
          baseQuery.customerId = customer;
      }

      // Add salesman filter
      if (salesman) {
          baseQuery.salesmanId = salesman;
      }

      // Add truck filter
      if (truck) {
          baseQuery.truckId = truck;
      }

      // Add status filter
      if (status) {
          baseQuery.status = status;
      }

      // Add date range filter
      if (fromDate || toDate) {
          baseQuery.createdAt = {};
          if (fromDate) {
              baseQuery.createdAt.$gte = new Date(fromDate);
          }
          if (toDate) {
              baseQuery.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
          }
      }

      // Get filtered data and counts
      const [orders, totalRecords, filteredCount] = await Promise.all([
          Order.find(baseQuery)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit),
          Order.countDocuments(),
          Order.countDocuments(baseQuery)
      ]);

      // Calculate summary data
      const summary = {
          total: await Order.countDocuments(),
          pending: await Order.countDocuments({ status: 'PENDING' }),
          completed: await Order.countDocuments({ status: 'COMPLETED' }),
          cancelled: await Order.countDocuments({ status: 'CANCELLED' }),
          delivered: await Order.countDocuments({ status: 'DELIVERED' })
      };

      res.json({
          draw: parseInt(draw, 10) || 1,
          recordsTotal: totalRecords,
          recordsFiltered: filteredCount,
          docs: orders,
          summary: summary
      });

  } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ 
          error: 'Failed to fetch orders',
          details: err.message 
      });
  }
};

//   app.post('/addtruck', async (req, res) => {


  exports.neworder = async (req, res) => {
    try {
      const {
        name, // Customer name
        customerId,
        area, // Delivery zone
        truckId,
        notes, // Delivery notes
        products, // Array of products from the form
        salesmanId, // You might get this from the session
        city, // You might want to add this to your form or get it from customer data
      } = req.body;
      // Calculate total price
      let totalPrice = 0;

      
      // Transform products array to match the schema
      const orderItems = products.map(product => {
        // Convert price to number and calculate total for this item
        const price = parseFloat(product.price);
        const quantity = parseInt(product.quantity);
        totalPrice += price * quantity;
        
        return {
          productname: product.name,
          productid: product.productid,
          quantity: quantity,
          price: product.price,
          // itemtype: product.type, // "Lend" or "Return"
          lendtype: product.type, // Default value based on type
        };
      });
  
      // Create new order
      const newOrder = new Order({
        name,
        customerId,
        area,
        truckId,
        salesmanId: salesmanId || req.session.userId, // Get from session if not provided
        status: 'PENDING',
        totalPrice,
        createdBy: req.session.userId, // Assuming you store user ID in session
        city,
        notes, // You may want to store notes in a separate field if needed
        order: orderItems,
      });
  
      // Save order to database
      await newOrder.save();
  
      // Redirect to order details or list page
      res.redirect('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).render('error', { 
        message: 'Failed to create order',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  };


  exports.editorderpage = async (req, res) => {
    try {
      const id = req.params.id;
      const order = await Order.findOne({id:id}).lean();
      
      if (!order) {
        return res.status(404).render('error', { 
          title: 'Order Not Found',
          message: 'The requested order does not exist'
        });
      }
      const payments = await Payments.find({orderId:id}).lean();
      // Format data for the view
      const viewData = {
        title: 'Al Qattara',
        route: 'Orders',
        sub: 'Edit Orders',
        order: {
          ...order,
          formattedDate: new Date(order.createdAt).toLocaleDateString(),
          products: order.order || [],
           payments: payments  // Using 'order' array from schema
        },
       // You might want to add payments data if available

      };
  
      res.render('order/updateorder', viewData);
  
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'An error occurred while fetching the order details'
      });
    }
  };

  // exports.updateOrder = async (req, res) => {

  //   try {
  //     const {
  //       orderId,
  //       name,
  //       customerId,
  //       area,
  //       truckId,
  //       notes,
  //       products,
  //       status,
  //       city,
  //       salesman
  //     } = req.body;
  //     const existingOrder = await Order.findOne({ id: orderId });
  //     if (!existingOrder) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Order not found'
  //       });
  //     }
  
  //     if (existingOrder.status !== 'PENDING') {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Order cannot be updated because its status is '${existingOrder.status}'`
  //       });
  //     }
  
  //     const truck = await Truck.findOne({ id: truckId });
  //     const salesmanId = salesman || truck?.salesmanId;
  
  //     let totalPrice = 0;
  //     const orderItems = [];
  //     const unavailableProducts = [];
  
  //     for (const product of products) {
  //       product.newcouponQty =0;

  //       if (product.rechargeId) {
  //         let conditionmatch = true
  //         let previousmatch = {}

  //         const recharge = await Recharge.findOne({ rechargeId: product.rechargeId });
  //         if (product._id) {
  //           matchedProduct = existingOrder.order.find(p => 
  //             p._id.toString() === product._id.toString()
  //           )
  //           if(matchedProduct && matchedProduct.couponQty>0){
  //             product.couponQty = product.couponQty - matchedProduct.couponQty
  //             previousmatch = matchedProduct;
  //             conditionmatch = matchedProduct.rechargeId==product.rechargeId?true:false;
  //           }
  //         }



        
  //         if (
  //           conditionmatch &&
  //            recharge 
  //           // &&
  //           // recharge.routes.includes(truck.routeid) &&
  //           // recharge.item === product.name
  //         ) {
  //           const activeCoupons = recharge.coupons.filter(c => c.status === 'ACTIVE');
        
  //           const availableCount = activeCoupons.length;
  //           const requiredQty = product.couponQty;
        
  //           const claimCount = Math.min(availableCount, requiredQty);
        
  //           const claimedCouponIds = activeCoupons.slice(0, claimCount).map(c => c._id);
        
  //           await Recharge.updateOne(
  //             { rechargeId: product.rechargeId },
  //             {
  //               $set: {
  //                 'coupons.$[elem].status': 'Claimed',
  //                 'coupons.$[elem].updated': new Date(),
  //                 'coupons.$[elem].orderid': orderId
  //               }
  //             },
  //             {
  //               arrayFilters: [
  //                 {
  //                   'elem.status': 'Active',
  //                   'elem._id': { $in: claimedCouponIds } // ✅ fixed here
  //                 }
  //               ]
  //             }
  //           );
            

  //           // Push claimed IDs to product.redeemedCoupons
  //           product.newredeemedCoupons = claimedCouponIds;
        
  //           // Update couponQty to actual claimed count
  //           product.newcouponQty = claimCount||0;
  //           product.newrechargeId = claimCount > 0 ? product.rechargeId : '';

  //          if(previousmatch){
  //           product.newredeemedCoupons = {...product.newredeemedCoupons,...previousmatch.redeamedcoupons}
  //           product.newcouponQty = product.newcouponQty + previousmatch.couponQty

  //          }

  //         }
  //       }
        
        

  //       const matchingEntries = truck.productDetails.filter(p => p.productname === product.productname);
  
  //       const outwardQty = matchingEntries
  //         .filter(p => p.inwardoutward === 'outward')
  //         .reduce((sum, p) => sum + (p.quantity || 0), 0);
  
  //       const inwardQty = matchingEntries
  //         .filter(p => p.inwardoutward === 'inward')
  //         .reduce((sum, p) => sum + (p.quantity || 0), 0);
  
  //       const deliveredQty = matchingEntries.reduce((sum, p) => sum + (p.delivered || 0), 0);
  
  //       const availableQty = outwardQty - inwardQty - deliveredQty;
  //       const requestedQty = Number(product.quantity) || 0;
  //       const price = Number(product.price) || 0;
  //       const quantity = Number(product.quantity) || 0;
        
  //       totalPrice += price * (quantity-product.newcouponQty);
  
  //       // Track insufficient stock only if status is DELIVERED
  //       if (status === 'DELIVERED' && availableQty - requestedQty < 0) {
  //         unavailableProducts.push({
  //           productname: product.productname,
  //           requested: requestedQty,
  //           available: availableQty
  //         });
  //         continue; // Skip adding this product to the order
  //       }
  //       if (status === 'DELIVERED') {
  //         const existingDeliveredEntry = truck.productDetails.find(p =>
  //           p.productid == product.productid ||
  //           p.productname == product.productname &&
  //           p.inwardoutward == 'delivered'
  //         );
          
  //         if (existingDeliveredEntry) {
  //           existingDeliveredEntry.delivered = (existingDeliveredEntry.delivered || 0) + quantity;
  //           existingDeliveredEntry.time = new Date(); // optional: update time
  //           existingDeliveredEntry.doneby = salesmanId; // optional: track who did the update
  //         } else {
  //           truck.productDetails.push({
  //             productid: product.productid,
  //             productname: product.productname,
  //             quantity: 0, // not used for delivered
  //             inwardoutward: 'delivered',
  //             delivered: quantity,
  //             time: new Date(),
  //             itemtype: product.itemtype || 'Normal',
  //             doneby: salesmanId,
  //             city
  //           });
  //         }
          
  //       }
  
  //       if (status === 'DELIVERED' && product.lendtype === 'Lend') {
  //         const newAsset = new CustomerAssetHistory({
  //           assetType: product.productname,
  //           noOfAssets: quantity,
  //           securityDeposit: price * quantity,
  //           customerId,
  //           salesmanId,
  //           truckId,
  //           lendType: 'CUSTODY'
  //         });
  //         await newAsset.save();
  //       }
  
  //       orderItems.push({
  //         productname: product.productname,
  //         productid: product.productid,
  //         quantity,
  //         price,
  //         total:totalPrice,
  //         lendtype: product.lendtype || 'LEND',
  //         itemtype: product.itemtype || 'Normal',     // Push claimed IDs to product.redeemedCoupons
  //         couponQty:  product.newcouponQty,
  //         rechargeId:product.newrechargeId , 
  //         redeamedcoupons: product.newredeemedCoupons
  //       });
  //     }
  //   truck.save()
  //     const updatedOrder = await Order.findOneAndUpdate(
  //       { id: orderId },
  //       {
  //         name,
  //         customerId,
  //         area,
  //         truckId,
  //         notes,
  //         salesmanId,
  //         status: status || 'PENDING',
  //         totalPrice,
  //         city,
  //         order: orderItems,
  //         updatedAt: new Date()
  //       },
  //       { new: true }
  //     );
  
  //     let message = 'Order updated successfully.';
  //     if (unavailableProducts.length > 0) {
  //       const productDetails = unavailableProducts
  //         .map(p => `${p.productname} (Requested: ${p.requested ?? 'N/A'}, Available: ${p.available ?? 'N/A'})`)
  //         .join('; ');
  //       message += ` Note: These products had insufficient stock at delivery time: ${productDetails}`;
  //     }
      
      
  //     return res.json({
  //       success: true,
  //       message,
  //       unavailableProducts,
  //       order: updatedOrder
  //     });
  
  //   } catch (error) {
  //     console.error('Error updating order:', error);
  //     return res.status(500).json({
  //       success: false,
  //       message: 'Error updating order',
  //       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  //     });
  //   }
  // };
  
  


////unwanted//

// exports.updateOrder = async (req, res) => {
//   try {
//     const {
//       orderId,
//       name,
//       customerId,
//       area,
//       truckId,
//       notes,
//       products,
//       status,
//       city,
//       salesman
//     } = req.body;

//     const existingOrder = await Order.findOne({ id: orderId });
//     if (!existingOrder) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     if (existingOrder.status !== 'PENDING') {
//       return res.status(400).json({ success: false, message: `Order cannot be updated because its status is '${existingOrder.status}'` });
//     }

//     const truck = await Truck.findOne({ id: truckId });
//     const salesmanId = salesman || truck?.salesmanId;

//     let totalPrice = 0;
//     const orderItems = [];
//     const unavailableProducts = [];

//     for (const product of products) {
//       product.newcouponQty = 0;
//       let matchedProduct = null;
//       let previousQty = 0;
//       let previousCoupons = [];

//       if (product._id) {
//         matchedProduct = existingOrder.order.find(p => p._id.toString() === product._id.toString());
//         if (matchedProduct && matchedProduct.couponQty > 0) {
//           product.couponQty = product.couponQty - matchedProduct.couponQty;
//           previousQty = matchedProduct.couponQty;
//           previousCoupons = matchedProduct.redeamedcoupons || [];
//         }
//       }

//       if (product.rechargeId) {
//         if (matchedProduct && matchedProduct.rechargeId && matchedProduct.rechargeId !== product.rechargeId) {
//           product.couponQty = previousQty;
//           product.newcouponQty = previousQty;
//           product.newredeemedCoupons = previousCoupons;
//           product.newrechargeId = matchedProduct.rechargeId;
//         } else {
//           const recharge = await Recharge.findOne({ rechargeId: product.rechargeId });
//           if (recharge) {
//             const activeCoupons = recharge.coupons.filter(c => c.status === 'ACTIVE');
//             const requiredQty = product.couponQty || 0;
//             const claimCount = Math.min(activeCoupons.length, requiredQty);
//             const claimedCouponIds = activeCoupons.slice(0, claimCount).map(c => c._id);

//             if (claimCount > 0) {
//               await Recharge.updateOne(
//                 { rechargeId: product.rechargeId },
//                 {
//                   $set: {
//                     'coupons.$[elem].status': 'Claimed',
//                     'coupons.$[elem].updated': new Date(),
//                     'coupons.$[elem].orderid': orderId
//                   }
//                 },
//                 {
//                   arrayFilters: [
//                     {
//                       'elem.status': 'ACTIVE',
//                       'elem._id': { $in: claimedCouponIds }
//                     }
//                   ]
//                 }
//               );

//               product.newredeemedCoupons = [...claimedCouponIds, ...previousCoupons];
//               product.newcouponQty = claimCount + previousQty;
//               product.newrechargeId = product.rechargeId;
//             }
//           }
//         }
//       }

//       const matchingEntries = truck.productDetails.filter(p => p.productname === product.productname);

//       const outwardQty = matchingEntries.filter(p => p.inwardoutward === 'outward').reduce((sum, p) => sum + (p.quantity || 0), 0);
//       const inwardQty = matchingEntries.filter(p => p.inwardoutward === 'inward').reduce((sum, p) => sum + (p.quantity || 0), 0);
//       const deliveredQty = matchingEntries.reduce((sum, p) => sum + (p.delivered || 0), 0);
//       const availableQty = outwardQty - inwardQty - deliveredQty;

//       const requestedQty = Number(product.quantity) || 0;
//       const price = Number(product.price) || 0;
//       const quantity = Number(product.quantity) || 0;

//       totalPrice += price * (quantity - product.newcouponQty);

//       if (status === 'DELIVERED' && availableQty - requestedQty < 0) {
//         unavailableProducts.push({ productname: product.productname, requested: requestedQty, available: availableQty });
//         continue;
//       }

//       if (status === 'DELIVERED') {
//         const existingDeliveredEntry = truck.productDetails.find(p =>
//           (p.productid == product.productid || p.productname == product.productname) &&
//           p.inwardoutward == 'delivered'
//         );

//         if (existingDeliveredEntry) {
//           existingDeliveredEntry.delivered = (existingDeliveredEntry.delivered || 0) + quantity;
//           existingDeliveredEntry.time = new Date();
//           existingDeliveredEntry.doneby = salesmanId;
//         } else {
//           truck.productDetails.push({
//             productid: product.productid,
//             productname: product.productname,
//             quantity: 0,
//             inwardoutward: 'delivered',
//             delivered: quantity,
//             time: new Date(),
//             itemtype: product.itemtype || 'Normal',
//             doneby: salesmanId,
//             city
//           });
//         }
//       }
//       const pdct = await Product.findOne({ name: product.productname });

//       if (status === 'DELIVERED' && (pdct.isasset ||product.lendtype === 'ASSETSOLD'|| product.lendtype === 'CUSTODY'||product.lendtype === 'DEPOSIT')) {
//         const newAsset = new CustomerAssetHistory({
//           assetType: product.productname,
//           noOfAssets: quantity,
//           securityDeposit: price * quantity,
//           customerId,
//           salesmanId,
//           truckId,
//           lendType: product.lendtype=='ASSETSOLD'?'SOLD':product.lendtype
//         });
//         await newAsset.save();
//       }

//       orderItems.push({
//         productname: product.productname,
//         productid: product.productid,
//         quantity,
//         price,
//         total: totalPrice,
//         lendtype: product.lendtype || 'LEND',
//         itemtype: product.itemtype || 'Normal',
//         couponQty: product.newcouponQty,
//         rechargeId: product.newrechargeId,
//         redeamedcoupons: product.newredeemedCoupons
//       });
//     }

//     await truck.save();

//     const updatedOrder = await Order.findOneAndUpdate(
//       { id: orderId },
//       {
//         name,
//         customerId,
//         area,
//         truckId,
//         notes,
//         salesmanId,
//         status: status || 'PENDING',
//         totalPrice,
//         city,
//         order: orderItems,
//         updatedAt: new Date()
//       },
//       { new: true }
//     );

//     let message = 'Order updated successfully.';
//     if (unavailableProducts.length > 0) {
//       const productDetails = unavailableProducts.map(p => `${p.productname} (Requested: ${p.requested ?? 'N/A'}, Available: ${p.available ?? 'N/A'})`).join('; ');
//       message += ` Note: These products had insufficient stock at delivery time: ${productDetails}`;
//     }

//     return res.json({
//       success: true,
//       message,
//       unavailableProducts,
//       order: updatedOrder
//     });
//   } catch (error) {
//     console.error('Error updating order:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error updating order',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };
exports.updateOrder = async (req, res) => {
  try {
    const { orderId, status, products, truckId, ...otherFields } = req.body;

    // Basic validations first
    const existingOrder = await Order.findOne({ id: orderId });
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (existingOrder.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be updated because its status is '${existingOrder.status}'` 
      });
    }

    // Early return if changing to DELIVERED without truckId
    if (status === 'DELIVERED' && !truckId) {
      return res.status(400).json({
        success: false,
        message: 'Truck ID is required when delivering an order'
      });
    }

    const truck = truckId ? await Truck.findOne({ id: truckId }) : null;
    const salesmanId = otherFields.salesman || truck?.salesmanId;

    // First pass: Validate stock availability if delivering
    if (status === 'DELIVERED') {
      const unavailableProducts = [];
      
      for (const product of products) {
        const matchingEntries = truck.productDetails.filter(p => 
          p.productname === product.productname
        );

        const outwardQty = matchingEntries
          .filter(p => p.inwardoutward === 'outward')
          .reduce((sum, p) => sum + (p.quantity || 0), 0);
        
        const inwardQty = matchingEntries
          .filter(p => p.inwardoutward === 'inward')
          .reduce((sum, p) => sum + (p.quantity || 0), 0);
        
        const deliveredQty = matchingEntries
          .reduce((sum, p) => sum + (p.delivered || 0), 0);
        
        const availableQty = outwardQty - inwardQty - deliveredQty;
        const requestedQty = Number(product.quantity) || 0;
        console.log(outwardQty,inwardQty,deliveredQty,requestedQty)

        if (availableQty < requestedQty) {
          unavailableProducts.push({
            productname: product.productname,
            requested: requestedQty,
            available: availableQty
          });
        }
      }

      if (unavailableProducts.length > 0) {
        const productDetails = unavailableProducts.map(p => 
          `${p.productname} (Requested: ${p.requested}, Available: ${p.available})`
        ).join(', ');
        
        return res.status(400).json({
          success: false,
          message: `Cannot deliver order - insufficient stock for: ${productDetails}`,
          unavailableProducts
        });
      }
    }

    // Process coupons and calculate total price
    let totalPrice = 0;
    const orderItems = await Promise.all(products.map(async (product) => {
      const { _id, rechargeId, couponQty = 0, quantity, price, ...rest } = product;
      const matchedProduct = _id ? existingOrder.order.find(p => p._id.toString() === _id.toString()) : null;

      // Handle coupon logic
      let newCouponQty = 0;
      let newRedeemedCoupons = [];
      let newRechargeId = null;

      if (rechargeId) {
        if (matchedProduct?.rechargeId && matchedProduct.rechargeId !== rechargeId) {
          newCouponQty = matchedProduct.couponQty;
          newRedeemedCoupons = matchedProduct.redeamedcoupons || [];
          newRechargeId = matchedProduct.rechargeId;
        } else {
          const recharge = await Recharge.findOne({ rechargeId });
          if (recharge) {
            const activeCoupons = recharge.coupons.filter(c => c.status === 'ACTIVE');
            const claimCount = Math.min(activeCoupons.length, couponQty);
            const claimedCouponIds = activeCoupons.slice(0, claimCount).map(c => c._id);

            if (claimCount > 0) {
              await Recharge.updateOne(
                { rechargeId },
                {
                  $set: {
                    'coupons.$[elem].status': 'Claimed',
                    'coupons.$[elem].updated': new Date(),
                    'coupons.$[elem].orderid': orderId
                  }
                },
                {
                  arrayFilters: [{ 'elem._id': { $in: claimedCouponIds } }]
                }
              );

              newCouponQty = claimCount + (matchedProduct?.couponQty || 0);
              newRedeemedCoupons = [...claimedCouponIds, ...(matchedProduct?.redeamedcoupons || [])];
              newRechargeId = rechargeId;
            }
          }
        }
      }

      totalPrice += (quantity - newCouponQty) * price;

      return {
        ...rest,
        productname: product.productname,
        productid: product.productid,
        quantity,
        price,
        total: (quantity - newCouponQty) * price,
        couponQty: newCouponQty,
        rechargeId: newRechargeId,
        redeamedcoupons: newRedeemedCoupons,
        lendtype: product.lendtype || 'LEND',
        itemtype: product.itemtype || 'Normal'
      };
    }));

    // Update truck inventory if delivering
    if (status === 'DELIVERED' && truck) {
      await Promise.all(products.map(async (product) => {
        const quantity = Number(product.quantity) || 0;
        const existingEntry = truck.productDetails.find(p =>
          (p.productid == product.productid || p.productname == product.productname) &&
          p.inwardoutward == 'delivered'
        );

        if (existingEntry) {
          existingEntry.delivered += quantity;
          existingEntry.time = new Date();
          existingEntry.doneby = salesmanId;
        } else {
          truck.productDetails.push({
            productid: product.productid,
            productname: product.productname,
            quantity: 0,
            inwardoutward: 'delivered',
            delivered: quantity,
            time: new Date(),
            itemtype: product.itemtype || 'Normal',
            doneby: salesmanId,
            city: otherFields.city
          });
        }

        // Handle asset products
        const pdct = await Product.findOne({ name: product.productname });
        if (pdct?.isasset || ['ASSETSOLD', 'CUSTODY', 'DEPOSIT'].includes(product.lendtype)) {
          const newAsset = new CustomerAssetHistory({
            assetType: product.productname,
            noOfAssets: quantity,
            securityDeposit: product.price * quantity,
            customerId: otherFields.customerId,
            salesmanId,
            truckId,
            lendType: product.lendtype === 'ASSETSOLD' ? 'SOLD' : product.lendtype
          });
          await newAsset.save();
        }
      }));

      await truck.save();
    }

    // Update the order
    const updatedOrder = await Order.findOneAndUpdate(
      { id: orderId },
      {
        ...otherFields,
        salesmanId,
        status: status || 'PENDING',
        totalPrice,
        order: orderItems,
        updatedAt: new Date()
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: `Order ${status === 'DELIVERED' ? 'delivered' : 'updated'} successfully`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
      Payments.find(query).sort({_id:-1}).skip(skip).limit(limit), // Fetch paginated data
      Payments.countDocuments(), // Total records count
      Payments.countDocuments(query), // Filtered records count
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
//////////^unwanted//////
exports.deleteorder = async (req, res) => {
  console.log('ssd')
  try {
    const { id } = req.body;
    console.log(req.body)
    await Order.findByIdAndDelete(id); // Delete order from DB
    res.json({ success: true });
} catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error deleting order" });
}
  

};

exports.updateOrderStatus = async (req, res) => {
  console.log(req.body)

  try {
    const { _id, id, delivered_at, assistants, priceFor5galBottle, priceFor200mlBottle, ...updateData } = req.body;

    // Ensure delivered_at is a proper Date object
    if (delivered_at) {
      updateData.delivered_at = new Date(delivered_at);
    }
    updateData.updatedAt = new Date();

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

      const response = await axios.get('https://smartsmsgateway.com/api/api_http.php', {
        params: {
            username: 'qatrawtr',
            password: smssecret,
            senderid: 'QATTARAWATR',
            to: '971505226253',
            text: `Thank you for your order with Al Qattara. Your purchase of AED ${updatedOrder.totalPrice} has been confirmed and Delivered. We appreciate your trust and look forward to serving you again.`,
            type: 'text'
        }
    });
    }

    res.redirect("/orderhistory/" + _id);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Error updating order" });
  }
};




exports.addpayments = async (req, res) => {
  try {
      const { orderId, paymentDate, modeOfPayment, amountpaid,salesmanid } = req.body;
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
      // Save the new payment in Payments
      const payment = new Payments({
          orderId: orderId,
          salesmanid:salesmanid,
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
    console.log(error)
      res.status(500).json({ success: false, message: "Server error" });
  }
};


// DELETE /payments/:paymentId
exports.deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // 1) Find the payment
    const payment = await Payments.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment ${paymentId} not found`
      });
    }

    // 2) Find the related order
    const order = await Order.findOne({ id: payment.orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${payment.orderId} not found`
      });
    }

    // 3) Compute the new creditAmountPaid
    const newCreditAmountPaid = parseFloat(order.creditAmountPaid) 
                               - parseFloat(payment.creditAmountPaid);
    // Clamp at zero
    const clampedCreditPaid = newCreditAmountPaid >= 0 
      ? newCreditAmountPaid 
      : 0;

    // 4) Recompute isCreditCustomerPaid
    const remainingAmount = parseFloat(order.totalPrice) - clampedCreditPaid;
    const isPaid = remainingAmount <= 0;

    // 5) Update the order
    order.creditAmountPaid   = clampedCreditPaid.toFixed(2);
    order.isCreditCustomerPaid = isPaid;
    await order.save();

    // 6) Delete the payment
    await payment.deleteOne();

    return res.json({
      success: true,
      message: `Payment ${paymentId} deleted and order updated`,
      order: {
        id: order.id,
        creditAmountPaid: order.creditAmountPaid,
        isCreditCustomerPaid: order.isCreditCustomerPaid
      }
    });

  } catch (err) {
    console.error('Error deleting payment:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting payment'
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
      const { 
          customer, 
          salesman, 
          truck, 
          status, 
          fromDate, 
          toDate 
      } = req.query;

      const cityFilter = req.session.city;

      // Build base query with city filter if applicable
      let baseQuery = {};
      
      if (cityFilter && cityFilter.toLowerCase() !== "all") {
          const trucksInCity = await Truck.find({ city: cityFilter }).select("id");
          const truckIds = trucksInCity.map(truck => truck.id);
          baseQuery.truckId = { $in: truckIds };
      }

      // Add customer filter
      if (customer) {
          baseQuery.customerId = customer;
      }

      // Add salesman filter
      if (salesman) {
          baseQuery.salesmanId = salesman;
      }

      // Add truck filter
      if (truck) {
          baseQuery.truckId = truck;
      }

      // Add status filter (not applied to pending payments count)
      if (status) {
          baseQuery.status = status;
      }

      // Add date range filter
      if (fromDate || toDate) {
          baseQuery.createdAt = {};
          if (fromDate) {
              baseQuery.createdAt.$gte = new Date(fromDate);
          }
          if (toDate) {
              baseQuery.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
          }
      }

      // Get all stats in parallel
      const [
          totalOrders,
          pendingOrders,
          revenueResult,
          pendingPayments
      ] = await Promise.all([
          // Total orders count
          Order.countDocuments(baseQuery),
          
          // Pending orders count (override status filter)
          Order.countDocuments({
              ...baseQuery,
              status: 'PENDING',
              ...(status && delete baseQuery.status) // Remove status filter for this count
          }),
          
          // Total revenue (sum of totalPrice)
          Order.aggregate([
              { $match: baseQuery },
              { $group: { _id: null, total: { $sum: "$totalPrice" } } }
          ]),
          
          // Pending payments count (isCreditCustomerPaid: false)
          Order.countDocuments({
              ...baseQuery,
              isCreditCustomerPaid: false,
              ...(status && delete baseQuery.status) // Remove status filter for this count
          })
      ]);

      // Extract revenue from aggregation result
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      res.json({
          success: true,
          data: {
              totalOrders,
              pendingOrders,
              totalRevenue,
              pendingPayments
          }
      });

  } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      res.status(500).json({ 
          success: false,
          error: 'Failed to fetch dashboard stats',
          details: err.message 
      });
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
      otp,
      orderid
    } = req.body;
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
    if (creditAmountPaid > 0 && modeOfPayment == 'Wallet') {
      if (otp) {
          const customer = await Customer.findOne({ id: customerId });
  
          if (!customer) {
              return res.status(400).json({ error: "Customer not found" });
          }
  
          if (customer.otp != otp) {
              return res.status(400).json({ error: "Invalid OTP. Please try again." });
          }
          if (customer.otpExpiresAt < new Date()) {
            return res.status(400).json({ error: "OTP expired. Please request a new one." });
        }
      } else {
          return res.status(400).json({ error: "OTP is required" });
      }
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
      const customerUpdate = await Customer.findOneAndUpdate(
        { id: customerId }, // Filter to find the customer by ID
        { $set: { lastOrderedAt: new Date() } }, // Update operation
        {
          new: true, // Return the updated document
          runValidators: true, // Ensure the update follows schema rules
        }
      );
  
      // Check if the customer was found and updated
    
    }
    if (order.status === "DELIVERED" && order.truckId) {
      const truckId = order.truckId;
      const noOf5galBottles = parseInt(order.noOf5galBottles) || 0;
      const noOf200mlBottles = parseInt(order.noOf200mlBottles) || 0;
    
      // Step 1: Reduce stock and increase delivered count
      await Truck.findOneAndUpdate(
        { id: truckId },
        {
          $inc: {
            remaining5galBottles: -noOf5galBottles,
            remaining200mlBottles: -noOf200mlBottles,
            delivered200mlBottles: noOf200mlBottles,
            delivered5galBottles: noOf5galBottles
          }
        }
      );
    
      // Step 2: Ensure stock values don't go negative
      await Truck.findOneAndUpdate(
        { id: truckId },
        [
          {
            $set: {
              remaining5galBottles: { $cond: [{ $lt: ["$remaining5galBottles", 0] }, 0, "$remaining5galBottles"] },
              remaining200mlBottles: { $cond: [{ $lt: ["$remaining200mlBottles", 0] }, 0, "$remaining200mlBottles"] }
            }
          }
        ]
      );
      const response = await axios.get('https://smartsmsgateway.com/api/api_http.php', {
      params: {
          username: 'qatrawtr',
          password: smssecret,
          senderid: 'QATTARAWATR',
          to: '971505226253',
          text: `Thank you for your order with Al Qattara. Your purchase of AED ${order.totalPrice} has been confirmed and Delivered. We appreciate your trust and look forward to serving you again.`,
          type: 'text'
      }
  });


    } 
    // Handle credit order history if payment is involved
    if (creditAmountPaid > 0) {
      const totalCreditAmountDue = Math.max(0, totalPrice - creditAmountPaid); // Prevent negative values
      const Payments = new Payments({
        orderId: order.id,
        modeOfPayment,
        creditAmountPaid,
        totalCreditAmountDue,
      });

      await Payments.save();

      if(totalCreditAmountDue === 0){
        order.isCreditCustomerPaid = true
        await order.save();
      }
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


exports.orderdetails = async (req, res) => {
  try {
    const customer = await Order.findOne({ id: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
  }

  exports.updatecreditorder = async (req, res) => {
    try {
      const { creditAmountPaid, modeOfPayment, orderid,salesmanId } = req.body;
  
      if (creditAmountPaid > 0) {
        const order = await Order.findOne({ id: orderid});
  
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
  
        // Add the new payment to the existing creditAmountPaid
        order.creditAmountPaid = (order.creditAmountPaid || 0) + creditAmountPaid;
  
        // Save the updated order
        await order.save();
  
        const Payments = new Payments({
          orderId: orderid,
          modeOfPayment,
          creditAmountPaid,
          totalCreditAmountDue: order.totalPrice - order.creditAmountPaid,
          salesmanid:salesmanId
        });
  
        await Payments.save();
  
        return res.status(201).json({
          message: "Order updated successfully!",
          order,
        });
      } else {
        return res.status(400).json({ error: "Invalid payment amount" });
      }
    } catch (error) {
      console.error("Error processing order:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  exports.getsalesum = async (req, res) => {
    try {
      const { salesmanId } = req.query;
  
      if (!salesmanId) {
        return res.status(400).json({ error: "Salesman ID is required" });
      }
  
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
  
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const salesDat = await Payments.find({salesmanid:salesmanId})
      const salesData = await Payments.aggregate([
        {
          $match: {
            salesmanid: salesmanId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            modeOfPayment: { $in: ["Cash", "Card", "Wallet"] }
          }
        },
        {
          $group: {
            _id: "$modeOfPayment",
            totalAmount: { $sum: "$creditAmountPaid" }
          }
        }
      ]);
      // Initialize result object
      let result = {
        Cash: 0,
        Card: 0,
        Wallet: 0,
        Total: 0 // New field for overall total
      };
  
      // Populate result from aggregation
      salesData.forEach(({ _id, totalAmount }) => {
        result[_id] = totalAmount;
        result.Total += totalAmount; // Sum all payments
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error getting sales sum:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

  exports.vieworder = async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      // Validate order ID format if needed (e.g., for MongoDB ObjectId)
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID format'
        });
      }
  
      const order = await Order.findById(orderId)
        .lean() // Convert to plain JavaScript object
        .exec();
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
  
      // Calculate any derived fields
      const balance = order.totalPrice - (order.creditAmountPaid || 0);
      
      // Format the response
      const response = {
        success: true,
        order: {
          ...order,
          balance: balance,
          // Add any other calculated fields
        }
      };
  
      res.json(response);
  
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      // Handle specific errors
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }
  
      res.status(500).json({
        success: false,
        message: 'Server error while fetching order details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };


  exports.getorderdeliverysummery = async (req, res) => {
    try {
      const { 
        truckId, 
        fromDate, 
        toDate,
        customer,
        salesman,
        status
      } = req.query;
      
      // Build base query
      let matchQuery = {};
      
      // Date range filter
      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
      }
      
      // Truck filter
      if (truckId) matchQuery.truckId = truckId;
      
      // Customer filter
      if (customer) matchQuery.customerId = customer;
      
      // Salesman filter
      if (salesman) matchQuery.salesmanId = salesman;
      
      // Status filter
      if (status) matchQuery.status = status;
      
      // City filter from session
      if (req.session.city && req.session.city.toLowerCase() !== "all") {
        const trucksInCity = await Truck.find({ city: req.session.city }).select("id");
        const truckIds = trucksInCity.map(truck => truck.id);
        matchQuery.truckId = { $in: truckIds };
      }

      // Aggregation pipeline
      const productSummaries = await Order.aggregate([
        // Match documents based on filters
        { $match: matchQuery },
        
        // Unwind the order array to process each product separately
        { $unwind: "$order" },
        
        // Group by product and calculate sums
        {
          $group: {
            _id: {
              // productId: "$order.productid",
              productName: "$order.productname"
            },
            totalDelivered: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "DELIVERED"] },
                  "$order.quantity",
                  0
                ]
              }
       
            },
            totalorder: {
              $sum:     "$order.quantity"
            },
            totalPending: {
              $sum:{
                $cond: [
                  { $eq: ["$status", "PENDING"] },
                  "$order.quantity",
                  0
                ]
              }
       
            }
          }
        },
        
        // Project to reshape the output
        {
          $project: {
            _id: 0,
            productId: "$_id.productId",
            productName: "$_id.productName",
            totalorder: 1,
            totalDelivered: 1,
            totalPending: 1
          }
        },
        
        // Sort by product name
        { $sort: { productName: 1 } }
      ]);

      // Get all products to ensure we show all even if no activity
      // const allProducts = await Product.find({}, 'productid name type');
      // console.log(allProducts)
      
      // // Merge with product data to include all products
      // // const mergedData = allProducts.map(product => {
      // //   const summary = productSummaries.find(p => p.productName == product.name.toString()) || {};
      // //   return {
      // //     productId: product.productid,
      // //     productName: product.name,
      // //     productType: product.type,
      // //     totalorder: summary.totalorder || 0,
      // //     totalDelivered: summary.totalDelivered || 0,
      // //     totalReturned: summary.totalReturned || 0
      // //   };
      // // });

      res.json({
        success: true,
        data: productSummaries
      });

    } catch (err) {
      console.error('Error fetching product summary:', err);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch product summary',
        details: err.message 
      });
    }
};



