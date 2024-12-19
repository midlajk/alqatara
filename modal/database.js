// Mongoose models for Customer, Recharge, Route, CreditOrderHistory, CustomerAssetHistory, DeletedCustomer, Employee, Order, Salesman, Truck, and TruckHistory

const mongoose = require('mongoose');

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
  uid: { type: String },
  noOf5galBottles: { type: Number, default: 0 },
  priceForA5galBottle: { type: Number },
  address: { type: String },
  contractDate: { type: Date },
  createdByEmployee: { type: String },
  representativeId: { type: String },
  noOfCoolers: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  isCompany: { type: Boolean, default: false },
  bottleLendType: { type: String },
  coolerLendType: { type: String },
  city: { type: String },
  bottleSecurityDeposit: { type: Number },
  coolerSecurityDeposit: { type: Number },
  zoneId: { type: String },
  trnNumber: { type: String },
  deliveryDay: { type: String },
  otherDetails: { type: String }
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
  supervisorMobileNumber: { type: String }
});

const creditOrderHistorySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
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
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  mobileNumber: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  uid: { type: String, required: true },
  designation: { type: String, required: true },
  permissions: { type: [String], required: true }
});

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  area: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
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
  deliveredAt: { type: Date },
  modeOfPayment: { type: String },
  createdBy: { type: String },
  assistants: { type: [String], default: [] },
  noOfCoolers: { type: Number, default: 0 },
  creditAmountPaid: { type: Number, default: 0 },
  isCredit: { type: Boolean, default: false }
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
  
  const truckSchema = new mongoose.Schema({
    id: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    salesmanId: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    damaged5galBottles: { type: Number, default: 0 },
    delivered200mlBottles: { type: Number, default: 0 },
    delivered5galBottles: { type: Number, default: 0 },
    remaining200mlBottles: { type: Number, default: 0 },
    remaining5galBottles: { type: Number, default: 0 },
    stockOf200mlBottles: { type: Number, default: 0 },
    stockOf5galBottles: { type: Number, default: 0 },
    assistants: { type: [String], default: [] },
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
    assistants: { type: [String], default: [] },
    routeId: { type: String, required: true },
    updatedBottleType: { type: String, enum: ['BOTH', '200ML', '5GAL'], required: true }
  });
  
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
    TruckHistory: mongoose.model('TruckHistory', truckHistorySchema)
  };
  