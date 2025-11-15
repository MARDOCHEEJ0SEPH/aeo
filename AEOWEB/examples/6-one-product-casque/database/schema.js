/**
 * MongoDB Database Schemas for SoundWave Pro E-Commerce
 * Author: Mardochée JOSEPH
 *
 * This file defines all Mongoose schemas for the application.
 * Import these schemas in server.js to avoid code duplication.
 * Following AEOWEB 100% standards.
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
  }],
  // Preferences
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
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
    default: 'soundwave-pro-headset',
    index: true
  },
  productName: {
    type: String,
    default: 'SoundWave Pro Wireless Headset'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
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
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
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
  // Customer details
  customerDetails: {
    name: String,
    phone: String
  },
  // Fulfillment
  trackingNumber: String,
  estimatedDelivery: Date,
  shippedAt: Date,
  deliveredAt: Date,
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
    this.orderNumber = `SW-${String(count + 1).padStart(6, '0')}`;
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
    default: 'soundwave-pro-headset',
    index: true
  },
  sku: {
    type: String,
    unique: true,
    default: 'SW-PRO-001'
  },
  name: {
    type: String,
    required: true,
    default: 'SoundWave Pro Wireless Headset'
  },
  description: {
    type: String,
    default: 'Premium wireless headset with active noise cancellation, 40-hour battery life, and studio-quality sound.'
  },
  // Pricing
  price: {
    type: Number,
    required: true,
    default: 29900 // $299.00 in cents
  },
  currency: {
    type: String,
    default: 'usd'
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
    default: 100,
    index: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  // Specifications
  specifications: {
    audioDriver: {
      type: String,
      default: '40mm dynamic drivers'
    },
    frequencyResponse: {
      type: String,
      default: '20Hz - 20kHz'
    },
    impedance: {
      type: String,
      default: '32 Ohm'
    },
    batteryLife: {
      type: String,
      default: '40 hours'
    },
    chargingTime: {
      type: String,
      default: '2 hours (USB-C fast charging)'
    },
    bluetooth: {
      type: String,
      default: 'Bluetooth 5.3'
    },
    noiseCancellation: {
      type: String,
      default: 'Active Noise Cancellation (ANC)'
    },
    weight: {
      type: String,
      default: '250g'
    },
    cableLength: {
      type: String,
      default: '1.2m detachable cable included'
    }
  },
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
// REVIEW SCHEMA (Optional - for customer reviews)
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
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One review per user per product

// ==============================================
// EXPORT MODELS
// ==============================================

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = {
  User,
  Order,
  Product,
  Review
};
