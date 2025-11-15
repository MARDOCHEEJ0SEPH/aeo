/**
 * MongoDB Database Seed Script for SoundWave Pro E-Commerce
 * Author: Mardochée JOSEPH
 *
 * This script populates the database with sample data for development and testing.
 * Following AEOWEB 100% standards.
 *
 * Prerequisites:
 *   - MongoDB running (local or Atlas)
 *   - Backend dependencies installed (cd backend && npm install)
 *   - .env file configured in backend directory
 *
 * Usage:
 *   From backend directory: npm run seed
 *   Or directly: node ../database/seed.js
 */

require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');
const { User, Order, Product, Review } = require('./schema');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected for seeding'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ==============================================
// SEED DATA
// ==============================================

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Clear existing data (optional - comment out to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // ==============================================
    // SEED PRODUCT
    // ==============================================
    console.log('📦 Seeding product...');

    const product = await Product.create({
      productId: 'soundwave-pro-headset',
      sku: 'SW-PRO-001',
      name: 'SoundWave Pro Wireless Headset',
      description: 'Premium wireless headset with active noise cancellation, 40-hour battery life, and studio-quality sound. Perfect for music lovers, gamers, and professionals.',
      price: 29900, // $299.00
      currency: 'usd',
      images: [
        { url: '/images/headset-main.jpg', alt: 'SoundWave Pro Wireless Headset', isPrimary: true },
        { url: '/images/headset-side.jpg', alt: 'SoundWave Pro side view', isPrimary: false },
        { url: '/images/headset-controls.jpg', alt: 'SoundWave Pro controls', isPrimary: false }
      ],
      inStock: true,
      inventory: 95,
      lowStockThreshold: 10,
      specifications: {
        audioDriver: '40mm dynamic drivers',
        frequencyResponse: '20Hz - 20kHz',
        impedance: '32 Ohm',
        batteryLife: '40 hours',
        chargingTime: '2 hours (USB-C fast charging)',
        bluetooth: 'Bluetooth 5.3',
        noiseCancellation: 'Active Noise Cancellation (ANC)',
        weight: '250g',
        cableLength: '1.2m detachable cable included'
      },
      seoTitle: 'SoundWave Pro Wireless Headset - Premium ANC, 40-Hour Battery',
      seoDescription: 'Experience studio-quality sound with the SoundWave Pro. Active noise cancellation, 40-hour battery life, Bluetooth 5.3. Free shipping.',
      seoKeywords: ['wireless headphones', 'noise cancelling headset', 'bluetooth headphones', 'premium audio'],
      isActive: true,
      isFeatured: true
    });

    console.log(`✅ Product created: ${product.name} (${product.productId})\n`);

    // ==============================================
    // SEED USERS
    // ==============================================
    console.log('👥 Seeding users...');

    const users = await User.create([
      {
        email: 'alex.rivera@example.com',
        lastLogin: new Date(),
        profile: { firstName: 'Alex', lastName: 'Rivera', phone: '+1-555-0201' },
        addresses: [{
          name: 'Alex Rivera',
          line1: '742 Soundwave Street',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'US',
          isDefault: true
        }],
        preferences: { newsletter: true, notifications: true }
      },
      {
        email: 'taylor.kim@example.com',
        lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        profile: { firstName: 'Taylor', lastName: 'Kim', phone: '+1-555-0202' },
        addresses: [{
          name: 'Taylor Kim',
          line1: '456 Music Avenue',
          city: 'Los Angeles',
          state: 'CA',
          postal_code: '90001',
          country: 'US',
          isDefault: true
        }],
        preferences: { newsletter: true, notifications: false }
      },
      {
        email: 'jordan.smith@example.com',
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        profile: { firstName: 'Jordan', lastName: 'Smith', phone: '+1-555-0203' },
        addresses: [{
          name: 'Jordan Smith',
          line1: '789 Audio Lane',
          city: 'Chicago',
          state: 'IL',
          postal_code: '60601',
          country: 'US',
          isDefault: true
        }],
        preferences: { newsletter: false, notifications: true }
      }
    ]);

    console.log(`✅ Created ${users.length} users\n`);

    // ==============================================
    // SEED ORDERS
    // ==============================================
    console.log('📋 Seeding orders...');

    const orders = await Order.create([
      // Completed order
      {
        userId: users[0]._id,
        email: users[0].email,
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        amount: 29900,
        currency: 'usd',
        stripeSessionId: 'cs_test_completed1',
        stripePaymentIntentId: 'pi_completed1',
        status: 'completed',
        shippingAddress: users[0].addresses[0],
        customerDetails: {
          name: users[0].profile.firstName + ' ' + users[0].profile.lastName,
          phone: users[0].profile.phone
        },
        trackingNumber: 'SW1Z999912345678',
        estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        shippedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      // Processing order
      {
        userId: users[1]._id,
        email: users[1].email,
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        amount: 29900,
        currency: 'usd',
        stripeSessionId: 'cs_test_processing1',
        stripePaymentIntentId: 'pi_processing1',
        status: 'processing',
        shippingAddress: users[1].addresses[0],
        customerDetails: {
          name: users[1].profile.firstName + ' ' + users[1].profile.lastName,
          phone: users[1].profile.phone
        },
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      // Pending order
      {
        userId: users[2]._id,
        email: users[2].email,
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        amount: 29900,
        currency: 'usd',
        stripeSessionId: 'cs_test_pending1',
        status: 'pending',
        createdAt: new Date()
      }
    ]);

    console.log(`✅ Created ${orders.length} orders\n`);

    // Update product inventory
    const soldQuantity = orders
      .filter(o => ['processing', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + o.quantity, 0);

    product.inventory -= soldQuantity;
    await product.save();
    console.log(`📊 Updated inventory: ${product.inventory} units remaining\n`);

    // ==============================================
    // SEED REVIEWS
    // ==============================================
    console.log('⭐ Seeding reviews...');

    const reviews = await Review.create([
      {
        userId: users[0]._id,
        orderId: orders[0]._id,
        productId: product.productId,
        rating: 5,
        title: 'Best headphones I\'ve ever owned!',
        comment: 'The sound quality is incredible and the noise cancellation is top-notch. Battery life easily lasts me through multiple days of use. Highly recommend!',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulVotes: 127,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[1]._id,
        productId: product.productId,
        rating: 5,
        title: 'Perfect for work and travel',
        comment: 'Love these headphones! The ANC blocks out all the noise on my commute and during flights. Comfortable for all-day wear.',
        isApproved: true,
        isVerifiedPurchase: false,
        helpfulVotes: 89,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[2]._id,
        productId: product.productId,
        rating: 4,
        title: 'Great sound, excellent battery',
        comment: 'The 40-hour battery life is no joke - I only charge these once a week! Sound quality is excellent for the price. Only complaint is they could be slightly lighter.',
        isApproved: true,
        isVerifiedPurchase: false,
        helpfulVotes: 54,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`✅ Created ${reviews.length} reviews\n`);

    // ==============================================
    // SUMMARY
    // ==============================================
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Orders: ${await Order.countDocuments()}`);
    console.log(`   - Reviews: ${await Review.countDocuments()}`);
    console.log('\n🎉 You can now start the server and test the application!');
    console.log('   Author: Mardochée JOSEPH');
    console.log('   Following AEOWEB 100% standards\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
