
require('../model/database')
const mongoose = require('mongoose');

const Customer = mongoose.model('Customer')
const Recharge = mongoose.model('Recharge')
const createError = require('http-errors');
const { v4: uuidv4 } = require('uuid'); // For generating unique coupon IDs

// Update your getrecharges function
exports.getrecharges = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue = req.query.search?.value || '';
    const regex = new RegExp(searchValue, 'i');

    const matchStage = {
      $or: [
        { 'customer.name': regex },
        { salesmanId: regex },
        { status: regex },
        { customerId: regex }
      ]
    };

    // First, get filtered count
    const countPipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: 'id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: matchStage
      },
      {
        $count: 'filteredCount'
      }
    ];

    const countResult = await Recharge.aggregate(countPipeline);
    const recordsFiltered = countResult[0]?.filteredCount || 0;

    // Then, get the actual data with pagination
    const dataPipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: 'id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: matchStage
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          'customer.name': 1,
          customerId: 1,
          salesmanId: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          paidcoupons: 1,
          freecoupons: 1,
          coupons: 1,
          totalCoupons: { $size: '$coupons' }
        }
      },
      {
        $sort: { _id: -1 }
      },
      { $skip: start },
      { $limit: length }
    ];

    const data = await Recharge.aggregate(dataPipeline);
    const recordsTotal = await Recharge.countDocuments();

    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data
    });

  } catch (error) {
    console.error('Error fetching recharges:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



// Add this new endpoint to get coupon details
exports.getCouponsByRecharge = async (req, res) => {
  try {
    const rechargeId = req.params.rechargeId;
    const recharge = await Recharge.findById(rechargeId).select('coupons');
    
    if (!recharge) {
      return res.status(404).json({ error: 'Recharge not found' });
    }

    res.json({
      success: true,
      coupons: recharge.coupons
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const { CouponSchema } = require('../model/database');
exports.downloadcoupon = async (req, res) => {
  try {
    const rechargeId = req.params.downloadid;
    if (!rechargeId) return res.status(400).send('Missing download ID');
    
    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) return res.status(404).send('Recharge not found');
    
    const activeCoupons = recharge.coupons.filter(coupon => coupon.status === 'ACTIVE');
    if (activeCoupons.length === 0) return res.status(404).send('No active coupons found');
    
    // PDF Setup
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      info: {
        Title: 'Alqattara Coupons',
        Author: 'Alqattara',
      }
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Alqattara_Coupons_${rechargeId}.pdf"`);
    doc.pipe(res);
    
    // Logo path
    const logoPath = path.join(__dirname, '../public/assets/img/brand/alqattaralogo.png');
    const logoWidth = 60;
    const logoHeight = 30;
    
    // Layout constants
    const couponWidth = doc.page.width - 60;
    const couponHeight = 110;
    const couponsPerPage = Math.floor((doc.page.height - 100) / (couponHeight + 20));
    
    let currentPage = 0;
    let couponsOnCurrentPage = 0;
    
    for (const [index, coupon] of activeCoupons.entries()) {
      // Check if we need a new page
      if (couponsOnCurrentPage >= couponsPerPage) {
        doc.addPage();
        currentPage++;
        couponsOnCurrentPage = 0;
      }
      
      // Calculate position
      const x = 30;
      const y = 50 + (couponsOnCurrentPage * (couponHeight + 20));
      
      // Coupon background
      doc.roundedRect(x, y, couponWidth, couponHeight, 5)
         .fillAndStroke('#FFFFFF', '#E0E0E0');
      
      // Coupon header with logo
      doc.rect(x, y, couponWidth, 25).fill('#ffffff');
      
      // Add logo if exists
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, x + 10, y + 5, { 
          width: logoWidth,
          height: logoHeight,
          fit: [logoWidth, logoHeight]
        });
      }
      
      // Company name
      doc.fillColor('#FFFFFF')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('ALQATTARA', x + logoWidth + 20, y + 8);
      
      // Coupon type badge
      const typeColor = coupon.coupontype === 'paid' ? '#3498DB' : '#2ECC71';
      doc.roundedRect(x + couponWidth - 90, y + 5, 80, 15, 3)
         .fill(typeColor);
      doc.fillColor('#FFFFFF')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(coupon.coupontype.toUpperCase(), x + couponWidth - 85, y + 8);
      
      // Coupon amount
      doc.fillColor('#2C3E50')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text(`₹${coupon.couponamt}`, x + 20, y + 35);
      
      // Coupon details
      doc.fillColor('#555555')
         .fontSize(9)
         .text('Coupon ID:', x + 20, y + 65);
      doc.fillColor('#333333')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(coupon.couponid, x + 20, y + 75);
      
      // QR Code with ID below
      const qrData = await QRCode.toDataURL(coupon.couponid);
      const qrSize = 60;
      
      doc.image(qrData, x + couponWidth - qrSize - 20, y + 35, { 
        width: qrSize,
        height: qrSize
      });
      

      
      // Add cut line if not last coupon
      if (index < activeCoupons.length - 1) {
        doc.moveTo(x, y + couponHeight + 10)
           .lineTo(x + couponWidth, y + couponHeight + 10)
           .strokeColor('#CCCCCC')
           .stroke();
        doc.fillColor('#999999')
           .fontSize(8)
           .text('✂', x + couponWidth - 10, y + couponHeight + 5);
      }
      
      couponsOnCurrentPage++;
    }
    
    // Footer
    doc.fontSize(9)
       .fillColor('#777777')
       .text('© Alqattara. Valid until redeemed.', 
             30, doc.page.height - 30, 
             { width: doc.page.width - 60, align: 'center' });
    
    doc.end();
  } catch (error) {
    console.error('Error generating coupons:', error);
    res.status(500).send('Error generating coupon PDF');
  }
};



exports.addwalletmoney = async (req, res) => {
  try {
    const { customerId, salesman, offer } = req.body;
    const coupon = await CouponSchema.findById(offer);
    console.log(coupon)
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Convert input values to numbers
    const amount = parseFloat(coupon.amount||0);
    const numCoupons = parseInt(coupon.paidcoupon||0, 10);
    const numFreeCoupons = parseInt(coupon.freecopon || 0, 10);


    // Validate inputs
    if (!customerId || isNaN(amount) || isNaN(numCoupons) || isNaN(numFreeCoupons)) {
        return res.status(400).json({ message: 'Invalid input values' });
    }

    // Generate paid coupons
    let coupons = [];
    if (numCoupons > 0) {
        const couponAmount = amount / numCoupons; // Calculate amount per paid coupon
        for (let i = 0; i < numCoupons; i++) {
            coupons.push({
                couponid: 'P-'+uuidv4(), // Unique ID for each coupon
                couponamt: couponAmount,
                coupontype: 'PAID',
                created: new Date(),
                status: 'ACTIVE'
            });
        }
    }

    // Generate free coupons with amount 0
    if (numFreeCoupons > 0) {
        for (let i = 0; i < numFreeCoupons; i++) {
            coupons.push({
                couponid: 'F-'+uuidv4(),
                couponamt: 0,
                coupontype: 'FREE',
                created: new Date(),
                status: 'ACTIVE'
            });
        }
    }
    // Create a new recharge entry
    const recharge = new Recharge({
        amount,
        customerId,
        salesmanId: salesman,
        paidcoupons:numCoupons,
        freecoupons:numFreeCoupons,
        coupons,
    });

    // Save to database
    await recharge.save();

    res.redirect('/wallet')
} catch (error) {
    console.error('Error processing wallet recharge:', error);
    res.status(500).json({ message: 'Internal Server Error' });
}
};
