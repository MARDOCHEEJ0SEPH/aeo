/**
 * MongoDB Database Schemas for OLI Juice E-Commerce
 * Author: Mardochée JOSEPH
 *
 * This file defines all Mongoose schemas for the application.
 * Import these schemas in server.js instead of defining them inline.
 */

const mongoose = require('mongoose');

// ==============================================
// USER SCHEMA
// ==============================================

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  loginToken: String,
  tokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastLogin: {
    type: Date,
    index: true
  },
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  // Customer profile
  profile: {
    firstName: String,
    lastName: String,
    phone: String
  },
  // Shipping addresses
  addresses: [{
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String,
    isDefault: Boolean
  }]
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// ==============================================
// ORDER SCHEMA
// ==============================================

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  productId: {
    type: String,
    default: 'oli-organic-juice',
    index: true
  },
  productName: {
    type: String,
    default: 'OLI Premium Organic Juice'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerBottle: {
    type: Number,
    required: true
  },
  discount: {
    percentage: {
      type: Number,
      default: 0
    },
    code: String,
    amount: {
      type: Number,
      default: 0
    }
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  // Stripe integration
  stripeSessionId: {
    type: String,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    index: true
  },
  // Order status
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  // Shipping information
  shippingAddress: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  shippingMethod: {
    type: String,
    default: 'standard'
  },
  estimatedDelivery: {
    type: Date,
    index: true
  },
  // Customer details
  customerDetails: {
    name: String,
    phone: String
  },
  // Fulfillment
  trackingNumber: String,
  trackingUrl: String,
  shippedAt: Date,
  deliveredAt: Date,
  // Notes
  customerNotes: String,
  internalNotes: String,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ stripeSessionId: 1 });
orderSchema.index({ orderNumber: 1 });

// Pre-save hook to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `OLI-${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// ==============================================
// SUBSCRIPTION SCHEMA
// ==============================================

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  subscriptionNumber: {
    type: String,
    unique: true,
    index: true
  },
  planName: {
    type: String,
    required: true,
    enum: ['Starter', 'Regular', 'Family', 'Bi-Weekly'],
    index: true
  },
  bottlesPerDelivery: {
    type: Number,
    required: true
  },
  deliveriesPerMonth: {
    type: Number,
    required: true
  },
  pricePerBottle: {
    type: Number,
    required: true
  },
  monthlyTotal: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active',
    index: true
  },
  // Delivery tracking
  nextDeliveryDate: {
    type: Date,
    index: true
  },
  lastDeliveryDate: Date,
  deliveryHistory: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    deliveryDate: Date,
    quantity: Number,
    amount: Number
  }],
  // Stripe subscription
  stripeSubscriptionId: {
    type: String,
    index: true
  },
  stripeCustomerId: String,
  // Preferences
  deliveryInstructions: String,
  pauseUntil: Date,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: Date,
  cancelReason: String
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextDeliveryDate: 1, status: 1 });
subscriptionSchema.index({ subscriptionNumber: 1 });

// Pre-save hook to generate subscription number
subscriptionSchema.pre('save', async function(next) {
  if (!this.subscriptionNumber) {
    const count = await mongoose.model('Subscription').countDocuments();
    this.subscriptionNumber = `SUB-${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// ==============================================
// PRODUCT SCHEMA
// ==============================================

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true,
    default: 'oli-organic-juice',
    index: true
  },
  sku: {
    type: String,
    unique: true,
    default: 'OLI-500ML-001'
  },
  name: {
    type: String,
    required: true,
    default: 'OLI Premium Organic Juice'
  },
  description: {
    type: String,
    default: '100% organic cold-pressed juice packed with vitamins, minerals, and antioxidants. 94% Daily Value of Vitamin C, 3.5g fiber, all-natural ingredients.'
  },
  // Pricing
  basePrice: {
    type: Number,
    required: true,
    default: 1299 // $12.99 in cents
  },
  currency: {
    type: String,
    default: 'usd'
  },
  // Volume discounts
  volumeDiscounts: [{
    minQuantity: Number,
    discountPercentage: Number
  }],
  // Product specifications
  bottleSize: {
    type: Number,
    default: 500 // ml
  },
  weight: {
    value: Number,
    unit: String // g, oz, etc.
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: String // cm, in, etc.
  },
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  // Inventory
  inStock: {
    type: Boolean,
    default: true,
    index: true
  },
  inventory: {
    type: Number,
    default: 1000,
    index: true
  },
  lowStockThreshold: {
    type: Number,
    default: 50
  },
  // Nutrition information (per 250ml serving)
  nutrition: {
    servingSize: {
      type: Number,
      default: 250
    }, // ml
    servingUnit: {
      type: String,
      default: 'ml'
    },
    calories: {
      type: Number,
      default: 120
    },
    totalFat: {
      type: Number,
      default: 0.5
    },
    saturatedFat: {
      type: Number,
      default: 0
    },
    transFat: {
      type: Number,
      default: 0
    },
    cholesterol: {
      type: Number,
      default: 0
    },
    sodium: {
      type: Number,
      default: 15
    },
    totalCarbs: {
      type: Number,
      default: 28
    },
    fiber: {
      type: Number,
      default: 3.5
    },
    sugar: {
      type: Number,
      default: 24
    },
    addedSugar: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 2.5
    },
    vitaminD: {
      type: Number,
      default: 0
    },
    calcium: {
      type: Number,
      default: 120
    },
    iron: {
      type: Number,
      default: 1.8
    },
    potassium: {
      type: Number,
      default: 350
    },
    vitaminC: {
      type: Number,
      default: 85
    },
    vitaminA: {
      type: Number,
      default: 200
    }
  },
  // Ingredients
  ingredients: [{
    name: String,
    percentage: Number,
    isOrganic: Boolean
  }],
  // Certifications
  certifications: [{
    name: String, // e.g., "USDA Organic", "Non-GMO", "Kosher"
    certificationBody: String,
    expiryDate: Date
  }],
  // Allergens
  allergens: [String],
  // SEO
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  // Stripe integration
  stripePriceId: String,
  stripeProductId: String,
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
productSchema.index({ productId: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ isActive: 1, inStock: 1 });

// Pre-save hook
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==============================================
// REVIEW SCHEMA
// ==============================================

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: {
    type: String,
    required: true
  },
  // Moderation
  isApproved: {
    type: Boolean,
    default: false,
    index: true
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  // Helpfulness
  helpfulVotes: {
    type: Number,
    default: 0
  },
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One review per user per product

// ==============================================
// ANALYTICS SCHEMA (for tracking)
// ==============================================

const analyticsSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'purchase', 'subscription_created'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: String,
  // Product related
  productId: String,
  quantity: Number,
  value: Number, // monetary value
  currency: String,
  // Page related
  page: String,
  referrer: String,
  // Device/Browser
  userAgent: String,
  ipAddress: String,
  // Location
  country: String,
  city: String,
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

// ==============================================
// EXPORT MODELS
// ==============================================

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = {
  User,
  Order,
  Subscription,
  Product,
  Review,
  Analytics
};
