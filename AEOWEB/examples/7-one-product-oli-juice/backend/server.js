const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ==============================================
// MONGODB SCHEMAS
// ==============================================

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  loginToken: String,
  tokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  preferences: {
    newsletter: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    default: 'oli-organic-juice'
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
    percentage: { type: Number, default: 0 },
    code: String,
    amount: { type: Number, default: 0 }
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  stripeSessionId: String,
  stripePaymentIntentId: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  customerDetails: {
    name: String,
    phone: String
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true,
    enum: ['Starter', 'Regular', 'Family', 'Bi-Weekly']
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
    default: 'active'
  },
  nextDeliveryDate: Date,
  lastDeliveryDate: Date,
  stripeSubscriptionId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    default: 'oli-organic-juice'
  },
  name: {
    type: String,
    default: 'OLI Premium Organic Juice'
  },
  description: String,
  basePrice: {
    type: Number,
    default: 1299 // $12.99 in cents
  },
  currency: {
    type: String,
    default: 'usd'
  },
  bottleSize: {
    type: Number,
    default: 500 // ml
  },
  images: [String],
  inStock: {
    type: Boolean,
    default: true
  },
  inventory: {
    type: Number,
    default: 1000
  },
  nutrition: {
    servingSize: { type: Number, default: 250 }, // ml
    calories: { type: Number, default: 120 },
    protein: { type: Number, default: 2.5 },
    carbs: { type: Number, default: 28 },
    sugar: { type: Number, default: 24 },
    fiber: { type: Number, default: 3.5 },
    vitaminC: { type: Number, default: 85 },
    calcium: { type: Number, default: 120 },
    iron: { type: Number, default: 1.8 }
  },
  stripePriceId: String
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Product = mongoose.model('Product', productSchema);

// ==============================================
// JWT AUTHENTICATION MIDDLEWARE
// ==============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==============================================
// AUTHENTICATION ROUTES
// ==============================================

// Email Authentication (Passwordless)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token (valid for 30 days)
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify Token
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==============================================
// PRODUCT ROUTES
// ==============================================

// Get Product Details
app.get('/api/product', async (req, res) => {
  try {
    let product = await Product.findOne({ productId: 'oli-organic-juice' });

    // Create default product if doesn't exist
    if (!product) {
      product = new Product({
        productId: 'oli-organic-juice',
        name: 'OLI Premium Organic Juice',
        description: '100% organic cold-pressed juice packed with vitamins, minerals, and antioxidants. 94% Daily Value of Vitamin C, 3.5g fiber, all-natural ingredients.',
        basePrice: 1299,
        currency: 'usd',
        bottleSize: 500,
        images: ['/images/oli-bottle.jpg'],
        inStock: true,
        inventory: 1000
      });
      await product.save();
    }

    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Calculate Pricing (with quantity discounts)
app.post('/api/product/calculate-price', async (req, res) => {
  try {
    const { quantity, discountCode } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    const product = await Product.findOne({ productId: 'oli-organic-juice' });
    const basePrice = product.basePrice;

    // Volume discounts
    let discount = 0;
    if (quantity >= 48) discount = 0.25;
    else if (quantity >= 24) discount = 0.20;
    else if (quantity >= 12) discount = 0.15;
    else if (quantity >= 6) discount = 0.10;

    const pricePerBottle = basePrice * (1 - discount);
    let total = pricePerBottle * quantity;

    // Apply discount code if provided
    let codeDiscount = 0;
    let validCode = false;
    if (discountCode) {
      const codes = {
        'WELCOME10': 0.10,
        'HEALTH15': 0.15,
        'SUMMER20': 0.20,
        'FRIEND25': 0.25
      };
      const code = discountCode.toUpperCase();
      if (codes[code]) {
        codeDiscount = codes[code];
        validCode = true;
        total = total * (1 - codeDiscount);
      }
    }

    res.json({
      quantity,
      basePrice: basePrice / 100,
      pricePerBottle: pricePerBottle / 100,
      subtotal: (pricePerBottle * quantity) / 100,
      volumeDiscount: discount * 100,
      discountCode: discountCode || null,
      codeDiscount: codeDiscount * 100,
      validCode,
      total: total / 100
    });

  } catch (error) {
    console.error('Price calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

// ==============================================
// STRIPE CHECKOUT ROUTES
// ==============================================

// Create Stripe Checkout Session
app.post('/api/checkout/create-session', authenticateToken, async (req, res) => {
  try {
    const { quantity, discountCode } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await Product.findOne({ productId: 'oli-organic-juice' });
    if (!product || !product.inStock) {
      return res.status(400).json({ error: 'Product not available' });
    }

    if (quantity > product.inventory) {
      return res.status(400).json({ error: 'Insufficient inventory' });
    }

    // Calculate pricing
    const pricingResponse = await fetch(`${process.env.FRONTEND_URL}/api/product/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, discountCode })
    });
    const pricing = await pricingResponse.json();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: `${quantity} bottle${quantity > 1 ? 's' : ''} of OLI Premium Organic Juice`,
              images: product.images.length > 0 ? product.images : undefined
            },
            unit_amount: Math.round((pricing.total / quantity) * 100)
          },
          quantity: quantity
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pages/cancel.html`,
      customer_email: user.email,
      client_reference_id: user._id.toString(),
      metadata: {
        userId: user._id.toString(),
        productId: product.productId,
        quantity: quantity.toString(),
        discountCode: discountCode || ''
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'AU']
      }
    });

    // Create pending order
    const order = new Order({
      userId: user._id,
      email: user.email,
      productId: product.productId,
      productName: product.name,
      quantity,
      pricePerBottle: pricing.pricePerBottle,
      discount: {
        percentage: pricing.volumeDiscount + pricing.codeDiscount,
        code: discountCode || null,
        amount: ((pricing.pricePerBottle * quantity) - pricing.total)
      },
      amount: Math.round(pricing.total * 100),
      currency: product.currency,
      stripeSessionId: session.id,
      status: 'pending'
    });

    await order.save();

    res.json({
      id: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe Webhook Handler
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      try {
        // Update order status
        const order = await Order.findOne({ stripeSessionId: session.id });

        if (order) {
          order.status = 'processing';
          order.stripePaymentIntentId = session.payment_intent;

          // Add shipping address
          if (session.shipping_details) {
            order.shippingAddress = session.shipping_details.address;
            order.customerDetails = {
              name: session.shipping_details.name,
              phone: session.customer_details.phone
            };

            // Calculate estimated delivery (3-7 business days)
            const estimatedDays = 5;
            order.estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
          }

          order.updatedAt = new Date();
          await order.save();

          // Decrease product inventory
          await Product.updateOne(
            { productId: order.productId },
            { $inc: { inventory: -order.quantity } }
          );

          console.log('Order updated successfully:', order._id);
        }
      } catch (error) {
        console.error('Error processing checkout.session.completed:', error);
      }
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;

      try {
        await Order.updateOne(
          { stripePaymentIntentId: failedPayment.id },
          { status: 'cancelled', updatedAt: new Date() }
        );
      } catch (error) {
        console.error('Error processing payment failure:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// ==============================================
// ORDER ROUTES
// ==============================================

// Get User Orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get Single Order
app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get Order by Session ID
app.get('/api/orders/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      stripeSessionId: req.params.sessionId,
      userId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ==============================================
// SUBSCRIPTION ROUTES
// ==============================================

// Create Subscription
app.post('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { planName, bottlesPerDelivery, deliveriesPerMonth, pricePerBottle, monthlyTotal } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate next delivery date (3 days from now)
    const nextDeliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const subscription = new Subscription({
      userId: user._id,
      email: user.email,
      planName,
      bottlesPerDelivery,
      deliveriesPerMonth,
      pricePerBottle,
      monthlyTotal,
      status: 'active',
      nextDeliveryDate
    });

    await subscription.save();

    res.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Get User Subscriptions
app.get('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Update Subscription Status
app.patch('/api/subscriptions/:subscriptionId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.subscriptionId, userId: req.user.userId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ==============================================
// ANALYTICS ROUTES
// ==============================================

// Get Sales Analytics
app.get('/api/analytics/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      status: { $in: ['processing', 'shipped', 'delivered'] }
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalBottles: { $sum: '$quantity' },
          totalRevenue: { $sum: '$amount' },
          averageOrderValue: { $avg: '$amount' },
          averageBottlesPerOrder: { $avg: '$quantity' }
        }
      }
    ]);

    res.json(analytics[0] || {
      totalOrders: 0,
      totalBottles: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      averageBottlesPerOrder: 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ==============================================
// HEALTH CHECK
// ==============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    author: 'Mardochée JOSEPH'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Author: Mardochée JOSEPH`);
});

module.exports = app;
