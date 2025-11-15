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
// IMPORT MONGODB MODELS (Following AEOWEB 100%)
// ==============================================

// Import models from centralized schema file to avoid duplication
const { User, Order, Product, Review } = require('../database/schema');

// JWT Authentication Middleware
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

// ============================================
// AUTHENTICATION ROUTES
// ============================================

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

    // Generate JWT token (valid for 7 days)
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
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
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Logout (client-side token deletion, optional backend tracking)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================
// PRODUCT ROUTES
// ============================================

// Get Product Details
app.get('/api/product', async (req, res) => {
  try {
    let product = await Product.findOne({ productId: 'soundwave-pro-headset' });

    // Create default product if doesn't exist
    if (!product) {
      product = new Product({
        productId: 'soundwave-pro-headset',
        name: 'SoundWave Pro Wireless Headset',
        description: 'Premium wireless headset with active noise cancellation, 40-hour battery life, and studio-quality sound.',
        price: 29900,
        currency: 'usd',
        images: ['/images/headset-main.jpg'],
        inStock: true,
        inventory: 100
      });
      await product.save();
    }

    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ============================================
// STRIPE CHECKOUT ROUTES
// ============================================

// Create Stripe Checkout Session
app.post('/api/checkout/create-session', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await Product.findOne({ productId: 'soundwave-pro-headset' });

    if (!product || !product.inStock) {
      return res.status(400).json({ error: 'Product not available' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
              images: product.images.length > 0 ? product.images : undefined
            },
            unit_amount: product.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pages/cancel.html`,
      customer_email: user.email,
      client_reference_id: user._id.toString(),
      metadata: {
        userId: user._id.toString(),
        productId: product.productId
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
      quantity: 1,
      amount: product.price,
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
          }

          order.updatedAt = new Date();
          await order.save();

          // Decrease product inventory
          await Product.updateOne(
            { productId: order.productId },
            { $inc: { inventory: -1 } }
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

// ============================================
// ORDER ROUTES
// ============================================

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

// Get Order by Session ID (for success page)
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

// ============================================
// ADMIN ROUTES (Optional - for order management)
// ============================================

// Update Order Status (Admin only - add admin auth middleware)
app.patch('/api/admin/orders/:orderId', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'processing', 'completed', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get All Orders (Admin)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const { status, limit = 100, skip = 0 } = req.query;

    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get Sales Analytics
app.get('/api/analytics/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      status: { $in: ['processing', 'completed'] }
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
          totalRevenue: { $sum: '$amount' },
          averageOrderValue: { $avg: '$amount' }
        }
      }
    ]);

    res.json(analytics[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
});

module.exports = app;
