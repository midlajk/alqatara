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
  lastOrderedAt: { type: Date },
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
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDebit: { type: Boolean, default: false },
  salesmanId: { type: String },
  status: { type: String, default: 'PENDING' }
});

const routeSchema = new mongoose.Schema({
 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  city: { type: String, required: true },
  mobileNumber: { type: String },
  supervisorMobileNumber: { type: String } ,
  id:Number,
});

const creditOrderHistorySchema = new mongoose.Schema({
  orderId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  modeOfPayment: { type: String, required: true },
  creditAmountPaid: { type: Number, required: true },
  totalCreditAmountDue: { type: Number, required: true }
});

const customerAssetHistorySchema = new mongoose.Schema({
  assetType: { type: String, required: true },
  noOfAssets: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  securityDeposit: { type: Number, default: 0 },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
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
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
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
  id: { type: Number,unique: true},
  name: { type: String, required: true },
  area: { type: String,},
  createdAt: { type: Date, default: Date.now },
  customerId: { type: String, ref: 'Customer', required: true },
  salesmanId: { type: String },
  truckId: { type: String },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'PENDING' },
  noOf200mlBottles: { type: Number, default: 0 },
  noOf5galBottles: { type: Number, default: 0 },
  isCreditCustomerOrder: { type: Boolean, default: false },
  isCreditCustomerPaid: { type: Boolean, default: false },
  priceFor200mlBottles: { type: Number, default: 0 },
  priceFor5galBottles: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  delivered_at: { type: Date },
  modeOfPayment: { type: String },
  createdBy: { type: String },
  assistants: { type: [String], default: [] },
  noOfCoolers: { type: Number, default: 0 },
  creditAmountPaid: { type: Number, default: 0 },
  isCredit: { type: Boolean, default: false }
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
      const existingCustomer = await mongoose.model('Customer').findOne({ id });
      if (!existingCustomer) {
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
  collectedBottleSecurityDeposits: { type: [{
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }
  }]},
  collectedCoolerSecurityDeposits: { type: [{
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }
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
    assistants: { type: String},
    routeId: { type: String, required: true },
    city: { type: String, required: true }
  });
  const truckHistorySchema = new mongoose.Schema({
    id: { type: String, required: true },
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
    assistants: { type: String},
    routeId: { type: String, required: true },
    updatedBottleType: { type: String, enum: ['BOTH', '200ML', '5GAL'] }
  });

  truckHistorySchema.pre("save", function (next) {
    if (!this.id) {
        this.id = uuidv4().replace(/-/g, "").slice(0, 24); // Generate a 24-character ID
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
   }, // Array of strings for readonly access options
  //   required: true, // Marked as required to ensure permissions are provided
  //   validate: {
  //     validator: function (v) {
  //       return v && v.length > 0; // Ensures the array is not empty
  //     },
  //     message: 'At least one readonly access must be selected',
  //   },
  // },
  readwrite: {
    type: [String], // Array of strings for read/write access options
    // required: true, // Marked as required to ensure permissions are provided
    // validate: {
    //   validator: function (v) {
    //     return v && v.length > 0; // Ensures the array is not empty
    //   },
    //   message: 'At least one read/write access must be selected',
    // },
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
const PrevilageClass = mongoose.model('PrevilageClass', PrevilageClassSchema);

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
    PrevilageClass:PrevilageClass
  };
  