// Mongoose models for Customer, Recharge, Route, CreditOrderHistory, CustomerAssetHistory, DeletedCustomer, Employee, Order, Salesman, Truck, and TruckHistory

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  haveCooler: { type: Boolean, default: false },
  isCredit: { type: Boolean, default: false },
  lastOrderedAt: { type: Date},
  mobileNumber: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  apartmentNumber: { type: String },
  mobileNumber2: { type: String },
  uid: { type: String , unique: true},
  noOf5galBottles: { type: Number, default: 0 },
  priceForA5galBottle: { type: Number },
  address: { type: String },
  contractDate: { type: Date },
  createdByEmployee: { type: String },
  representativeId: { type: String },
  noOfCoolers: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  // routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  routeId: { type: String },
  isCompany: { type: Boolean, default: false },
  bottleLendType: { type: String },
  coolerLendType: { type: String },
  city: { type: String },
  bottleSecurityDeposit: { type: Number },
  coolerSecurityDeposit: { type: Number },
  zoneId: { type: String },
  trnNumber: { type: String },
  deliveryDay: { type: String },
  language: { type: String },
  id:Number,
  otp:Number
});
customerSchema.pre('save', async function (next) {
  if (!this.uid) {
    const generateUid = (length) => {
      const randomDigits = Math.random().toString().slice(2, 2 + length);
      return randomDigits;
    };

    let unique = false;
    let uid;

    while (!unique) {
      // Generate 6-digit or 10-digit UID
      uid = generateUid(6); // Change to 10 for 10-digit UID
      // Check for uniqueness
      const existingCustomer = await mongoose.model('Customer').findOne({ uid });
      if (!existingCustomer) {
        unique = true;
      }
    }

    this.uid = uid;
  }
  next();
});
customerSchema.pre('save', async function (next) {
  if (!this.id) {
    // Helper function to generate a six-digit number
    const generateSixDigitId = () => {
      // Generates a random number between 100000 and 999999 (inclusive)
      return Math.floor(100000 + Math.random() * 900000);
    };

    let unique = false;
    let newId;

    while (!unique) {
      newId = generateSixDigitId();
      // Check if any customer already has this id
      const existingCustomer = await mongoose.model('Customer').findOne({ id: newId });
      if (!existingCustomer) {
        unique = true;
      }
    }

    this.id = newId;
  }
  next();
});
const rechargeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  customerId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDebit: { type: Boolean, default: false },
  salesmanId: { type: String },
  status: { type: String, default: 'PENDING' },
  paidcoupons:Number,
  freecoupons:Number,
  coupons : [{
    couponid:String,
    couponamt:Number,
    coupontype:String,
    created:{ type: Date, default: Date.now },
    status:String,
    updated:Date,

  }]
});

const routeSchema = new mongoose.Schema({
 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  city: { type: String, required: true },
  mobileNumber: { type: String },
  supervisorMobileNumber: { type: String } ,
  id:String,
});

const creditOrderHistorySchema = new mongoose.Schema({
  orderId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  modeOfPayment: { type: String, required: true },
  creditAmountPaid: { type: Number, required: true },
  totalCreditAmountDue: { type: Number, required: true },
  salesmanid:{ type: String }
});

const customerAssetHistorySchema = new mongoose.Schema({
  assetType: { type: String, required: true },
  noOfAssets: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  securityDeposit: { type: Number, default: 0 },
  customerId: { type: String, required: true },
  salesmanId: { type: String },
  truckId: { type: String },
  lendType: { type: String, required: true }
});

const deletedCustomerSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  uid: { type: String },
  name: { type: String, required: true },
  mobileNumber: { type: String },
  mobileNumber2: { type: String },
  noOf5galBottles: { type: Number, default: 0 },
  location: { type: String },
  isCredit: { type: Boolean, default: false },
  haveCooler: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  lastOrderedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  priceForA5galBottle: { type: Number },
  city: { type: String },
  apartmentNumber: { type: String },
  routeId: { type: String, },
  address: { type: String },
  contractDate: { type: Date },
  representativeId: { type: String },
  createdByEmployee: { type: String },
  noOfCoolers: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  isCompany: { type: Boolean, default: false },
  bottleLendType: { type: String },
  coolerLendType: { type: String },
  bottleSecurityDeposit: { type: Number },
  coolerSecurityDeposit: { type: Number },
  zoneId: { type: String },
  trnNumber: { type: String },
  deliveryDay: { type: String },
  otpGenerated: { type: String },
  language: { type: String },
  customerCreatedAt: { type: Date },
  customerUpdatedAt: { type: Date }
});

const employeeSchema = new mongoose.Schema({
  id: { type: String,unique: true, default: uuidv4},
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  mobileNumber: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  uid: { type: String, required: true , default: uuidv4},
  designation: { type: String, required: true },
  permissions: { type: [String], required: true }
});

const orderSchema = new mongoose.Schema({
  
  // noOf200mlBottles: { type: Number, default: 0 },
  // noOf5galBottles: { type: Number, default: 0 },
  // // noOfCoolers: { type: Number, default: 0 },
  // // priceFor200mlBottles: { type: Number, default: 0 },
  // priceFor5galBottles: { type: Number, default: 0 },
  id: { type: String,unique: true},
  name: { type: String, required: true },
  area: { type: String,},
  createdAt: { type: Date, default: Date.now },
  customerId: { type: String, ref: 'Customer', required: true },
  salesmanId: { type: String },
  truckId: { type: String , required: true },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'PENDING' },
  isCreditCustomerOrder: { type: Boolean, default: false },
  isCreditCustomerPaid: { type: Boolean, default: false },
  totalPrice: { type: Number, default: 0 },
  delivered_at: { type: Date },
  modeOfPayment: { type: String },
  createdBy: { type: String },
  assistants: { type: [String], default: [] },
  creditAmountPaid: { type: Number, default: 0 },
  isCredit: { type: Boolean, default: false },
  city: { type:String},
  notes:{ type:String},
  order:[{
    productid: { type: String },
    productname: { type:String}, 
    quantity: { type: Number },
    price:{ type:String}, 
    total: { type: Date }, // If product is returned
    itemtype: { type:String}, // If product is damaged
    lendtype: { type:String}, // If product is damaged

  }]

});
orderSchema.pre('save', async function (next) {
  if (!this.id) {
    const generateUid = (length) => {
      const randomDigits = Math.random().toString().slice(2, 2 + length);
      return randomDigits;
    };

    let unique = false;
    let id;

    while (!unique) {
      // Generate 6-digit or 10-digit UID
      id = generateUid(10); // Change to 10 for 10-digit UID
      // Check for uniqueness
      const existingOrder = await mongoose.model('Order').findOne({ id });
      if (!existingOrder) {
        unique = true;
      }
    }

    this.id = id;
  }
  next();
});
const salesmanSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  city: { type: String, required: true },
  commissionschmes:[String],
  tok:String,
  collectedBottleSecurityDeposits: { type: [{
    date: { type: Date},
    amount: { type: Number },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'}
  }]},
  collectedCoolerSecurityDeposits: { type: [{
    date: { type: Date},
    amount: { type: Number },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }
  }]}
  });
  salesmanSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
     
      this.password = await bcrypt.hash(this.password, 10);
      next();
    } catch (err) {
      next(err);
    }
  });
  
  const truckSchema = new mongoose.Schema({
    id: { type: String, required: true ,unique: true},
    createdAt: { type: Date, default: Date.now },
    salesmanId: { type: String},
    updatedAt: { type: Date, default: Date.now },
    damaged5galBottles: { type: Number, default: 0 },
    delivered200mlBottles: { type: Number, default: 0 },
    delivered5galBottles: { type: Number, default: 0 },
    remaining200mlBottles: { type: Number, default: 0 },
    remaining5galBottles: { type: Number, default: 0 },
    stockOf200mlBottles: { type: Number, default: 0 },
    stockOf5galBottles: { type: Number, default: 0 },
    assistants: [],
    routeId: { type: String, required: true },
    city: { type: String, required: true },
    productDetails: [{
      productid: { type: String },
      productname: { type:String}, 
      quantity: { type: Number },
      inwardoutward:{ type:String}, 
      time: { type: Date }, // If product is returned
      itemtype: { type:String}, // If product is damaged
      doneby: { type:String}, // If product is damaged
      city: { type:String},
      previousStock: { type: Number },
      previousDamage: { type: Number },
      previousDiscard: { type: Number },
      delivered:Number
    }]
    }, { timestamps: true });
  const truckHistorySchema = new mongoose.Schema({
    id: { type: String, },
    truckCreatedAt: { type: Date, required: true },
    truckUpdatedAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    truckId: { type: String, required: true },
    salesmanId: { type: String, required: true },
    damaged5galBottles: { type: Number, default: 0 },
    delivered200mlBottles: { type: Number, default: 0 },
    delivered5galBottles: { type: Number, default: 0 },
    remaining200mlBottles: { type: Number, default: 0 },
    remaining5galBottles: { type: Number, default: 0 },
    stockOf200mlBottles: { type: Number, default: 0 },
    stockOf5galBottles: { type: Number, default: 0 },
    assistants: [],
    routeId: { type: String, required: true },
    updatedBottleType: { type: String, enum: ['BOTH', '200ML', '5GAL'] },
    productDetails: [{
      productid: { type: String },
      productname: { type:String}, 
      quantity: { type: Number },
      inwardoutward:{ type:String}, 
      time: { type: Date }, // If product is returned
      itemtype: { type:String}, // If product is damaged
      doneby: { type:String}, // If product is damaged
      city: { type:String},
      previousStock: { type: Number },
      previousDamage: { type: Number },
      previousDiscard: { type: Number },
      delivered:Number
    }]
  });
  truckHistorySchema.pre("save", function (next) {
    if (this.isNew && !this.id) {
        this.id = uuidv4().replace(/-/g, "").slice(0, 24);
    }
    next();
});
  const zoneSchema = new mongoose.Schema({
    id: { type: String, },  // Zone ID (Unique)
    routeId: { type: String, required: true },  // Route
    creationDate: { type: Date, default: Date.now },  // Creation Date
    updatedAt: { type: Date, default: Date.now },  // Updated At
  }
);

const PrevilageClassSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    unique: true, // Ensures the class name is unique
  },
  readonly: {
    type: [String],
   }, 
  
  readwrite: {
    type: [String], // Array of strings for read/write access options
  
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets the creation date
  },
});
const citySchema = new mongoose.Schema({
 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  city: { type: String, required: true },
  mobileNumber: { type: String },
  supervisorMobileNumber: { type: String } ,
  id:Number,
});



const productSchema = new mongoose.Schema({
  productid: { type: String, required: true, unique: true }, // Ensure uniqueness
  name: { type: String, required: true },
  priority: { type: String },
  baseprice: { type: Number },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  stock:[{
    type: { type: String },
    currentStock: { type: Number, default: 0 },
    oldStock: { type: Number, default: 0 }, // Track damaged products
    damagedStock: { type: Number, default: 0 }, // Track damaged products
    discardedStock: { type: Number, default: 0 },
    city:{ type: String },

  }]
  // Track damaged products
  
});

const stockdelivery = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  truckId: { type: String, required: true },
  city: { type:String},
  productDetails: [{
    productid: { type: String },
    productname: { type:String}, 
    quantity: { type: Number },
    inwardoutward:{ type:String}, 
    time: { type: Date }, // If product is returned
    itemtype: { type:String}, // If product is damaged
    doneby: { type:String}, // If product is damaged
    city: { type:String},
    previousStock: { type: Number },
    previousDamage: { type: Number },
    previousDiscard: { type: Number },
  }],
  status: { type: String }, // Total products loaded onto the truck
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const stockAdditionSchema = new mongoose.Schema({
  productid: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantityAdded: { type: Number },
  date: { type: Date, default: Date.now },
  reason: { type: String } // (e.g., "stock purchase", "return", etc.)
});
const couponSchema = new mongoose.Schema({
  code: { type: String },
  amount: { type: Number },
  creationdate: { type: Date, default: Date.now },
  items: { type: [String] } ,
  paidcoupon:{ type: Number },
  freecopon:{ type: Number },
  // (e.g., "stock purchase", "return", etc.)
});

const commissionSchema = new mongoose.Schema({
  code: { type: String },
  achievement: { type: Number },
  creationdate: { type: Date, default: Date.now },
  benifit:{ type: String },
  increment:{ type: Number },
  // (e.g., "stock purchase", "return", etc.)
});
// const StockAddition = mongoose.model('StockAddition', stockAdditionSchema);



// const PrevilageClass = mongoose.model('PrevilageClass', PrevilageClassSchema);

  // Create the Zone Model
  const Zone = mongoose.model('Zone', zoneSchema);
  // Export all the models
  module.exports = {
    Customer: mongoose.model('Customer', customerSchema),
    Recharge: mongoose.model('Recharge', rechargeSchema),
    Route: mongoose.model('Route', routeSchema),
    CreditOrderHistory: mongoose.model('CreditOrderHistory', creditOrderHistorySchema),
    CustomerAssetHistory: mongoose.model('CustomerAssetHistory', customerAssetHistorySchema),
    DeletedCustomer: mongoose.model('DeletedCustomer', deletedCustomerSchema),
    Employee: mongoose.model('Employee', employeeSchema),
    Order: mongoose.model('Order', orderSchema),
    Salesman: mongoose.model('Salesman', salesmanSchema),
    Truck: mongoose.model('Truck', truckSchema),
    TruckHistory: mongoose.model('TruckHistory', truckHistorySchema),
    CitySchema:mongoose.model('CitySchema', citySchema),
    Zone:Zone,
    PrevilageClass:mongoose.model('PrevilageClass', PrevilageClassSchema),
    Product:mongoose.model('Product', productSchema),
    Stockdelivery:mongoose.model('Stockdelivery', stockdelivery),
    StockAddition:mongoose.model('StockAddition', stockAdditionSchema),
    CouponSchema:mongoose.model('CouponSchema',couponSchema),
    CommissionSchema:mongoose.model('CommissionSchema',commissionSchema)

  };
  