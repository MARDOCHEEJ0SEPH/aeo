/**
 * MongoDB Database Seed Script for OLI Juice E-Commerce
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
const { User, Order, Subscription, Product, Review, Analytics } = require('./schema');

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
    await Subscription.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Analytics.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // ==============================================
    // SEED PRODUCT
    // ==============================================
    console.log('📦 Seeding product...');

    const product = await Product.create({
      productId: 'oli-organic-juice',
      sku: 'OLI-500ML-001',
      name: 'OLI Premium Organic Juice',
      description: '100% organic cold-pressed juice packed with vitamins, minerals, and antioxidants. 94% Daily Value of Vitamin C, 3.5g fiber, all-natural ingredients. Made fresh daily with sustainably sourced fruits and vegetables.',
      basePrice: 1299, // $12.99
      currency: 'usd',
      volumeDiscounts: [
        { minQuantity: 6, discountPercentage: 10 },
        { minQuantity: 12, discountPercentage: 15 },
        { minQuantity: 24, discountPercentage: 20 },
        { minQuantity: 48, discountPercentage: 25 }
      ],
      bottleSize: 500,
      weight: { value: 520, unit: 'g' },
      dimensions: { length: 7, width: 7, height: 20, unit: 'cm' },
      images: [
        { url: '/images/oli-bottle-main.jpg', alt: 'OLI Premium Organic Juice 500ml bottle', isPrimary: true },
        { url: '/images/oli-bottle-label.jpg', alt: 'OLI Juice nutrition label', isPrimary: false },
        { url: '/images/oli-ingredients.jpg', alt: 'Fresh organic ingredients', isPrimary: false }
      ],
      inStock: true,
      inventory: 1000,
      lowStockThreshold: 50,
      nutrition: {
        servingSize: 250,
        servingUnit: 'ml',
        calories: 120,
        totalFat: 0.5,
        saturatedFat: 0,
        transFat: 0,
        cholesterol: 0,
        sodium: 15,
        totalCarbs: 28,
        fiber: 3.5,
        sugar: 24,
        addedSugar: 0,
        protein: 2.5,
        vitaminD: 0,
        calcium: 120,
        iron: 1.8,
        potassium: 350,
        vitaminC: 85,
        vitaminA: 200
      },
      ingredients: [
        { name: 'Organic Orange Juice', percentage: 40, isOrganic: true },
        { name: 'Organic Carrot Juice', percentage: 30, isOrganic: true },
        { name: 'Organic Apple Juice', percentage: 20, isOrganic: true },
        { name: 'Organic Ginger', percentage: 5, isOrganic: true },
        { name: 'Organic Turmeric', percentage: 3, isOrganic: true },
        { name: 'Organic Lemon Juice', percentage: 2, isOrganic: true }
      ],
      certifications: [
        { name: 'USDA Organic', certificationBody: 'USDA', expiryDate: new Date('2025-12-31') },
        { name: 'Non-GMO Project Verified', certificationBody: 'Non-GMO Project', expiryDate: new Date('2025-12-31') },
        { name: 'Certified Vegan', certificationBody: 'Vegan Action', expiryDate: new Date('2025-12-31') }
      ],
      allergens: [],
      seoTitle: 'OLI Premium Organic Juice - 100% Cold-Pressed, No Added Sugar',
      seoDescription: 'Supercharge your health with OLI Premium Organic Juice. 94% DV Vitamin C, 3.5g fiber. Free shipping on orders $50+. Subscribe and save 25%.',
      seoKeywords: ['organic juice', 'cold-pressed juice', 'vitamin c', 'healthy drinks', 'no added sugar', 'vegan'],
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
        email: 'sarah.johnson@example.com',
        lastLogin: new Date(),
        preferences: { newsletter: true, notifications: true },
        profile: { firstName: 'Sarah', lastName: 'Johnson', phone: '+1-555-0101' },
        addresses: [{
          name: 'Sarah Johnson',
          line1: '123 Wellness Ave',
          city: 'Los Angeles',
          state: 'CA',
          postal_code: '90001',
          country: 'US',
          isDefault: true
        }]
      },
      {
        email: 'michael.chen@example.com',
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        preferences: { newsletter: true, notifications: true },
        profile: { firstName: 'Michael', lastName: 'Chen', phone: '+1-555-0102' },
        addresses: [{
          name: 'Michael Chen',
          line1: '456 Health Street',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'US',
          isDefault: true
        }]
      },
      {
        email: 'emily.parker@example.com',
        lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        preferences: { newsletter: true, notifications: false },
        profile: { firstName: 'Emily', lastName: 'Parker', phone: '+1-555-0103' },
        addresses: [{
          name: 'Emily Parker',
          line1: '789 Organic Blvd',
          city: 'Portland',
          state: 'OR',
          postal_code: '97201',
          country: 'US',
          isDefault: true
        }]
      },
      {
        email: 'david.martinez@example.com',
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        preferences: { newsletter: false, notifications: true },
        profile: { firstName: 'David', lastName: 'Martinez', phone: '+1-555-0104' },
        addresses: [{
          name: 'David Martinez',
          line1: '321 Vitality Lane',
          city: 'Austin',
          state: 'TX',
          postal_code: '73301',
          country: 'US',
          isDefault: true
        }]
      },
      {
        email: 'jessica.lee@example.com',
        lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        preferences: { newsletter: true, notifications: true },
        profile: { firstName: 'Jessica', lastName: 'Lee', phone: '+1-555-0105' },
        addresses: [{
          name: 'Jessica Lee',
          line1: '555 Green Way',
          city: 'Seattle',
          state: 'WA',
          postal_code: '98101',
          country: 'US',
          isDefault: true
        }]
      }
    ]);

    console.log(`✅ Created ${users.length} users\n`);

    // ==============================================
    // SEED ORDERS
    // ==============================================
    console.log('📋 Seeding orders...');

    const orders = await Order.create([
      // Delivered orders
      {
        userId: users[0]._id,
        email: users[0].email,
        productId: product.productId,
        productName: product.name,
        quantity: 12,
        pricePerBottle: 11.04, // 15% discount
        discount: { percentage: 15, code: null, amount: 23.28 },
        amount: 13248, // $132.48 in cents
        currency: 'usd',
        stripeSessionId: 'cs_test_delivered1',
        stripePaymentIntentId: 'pi_delivered1',
        status: 'delivered',
        shippingAddress: users[0].addresses[0],
        customerDetails: { name: users[0].profile.firstName + ' ' + users[0].profile.lastName, phone: users[0].profile.phone },
        trackingNumber: 'TRK123456789',
        trackingUrl: 'https://tracking.example.com/TRK123456789',
        estimatedDelivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        shippedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[1]._id,
        email: users[1].email,
        productId: product.productId,
        productName: product.name,
        quantity: 24,
        pricePerBottle: 10.39, // 20% discount
        discount: { percentage: 20, code: null, amount: 62.16 },
        amount: 24936, // $249.36 in cents
        currency: 'usd',
        stripeSessionId: 'cs_test_delivered2',
        stripePaymentIntentId: 'pi_delivered2',
        status: 'delivered',
        shippingAddress: users[1].addresses[0],
        customerDetails: { name: users[1].profile.firstName + ' ' + users[1].profile.lastName, phone: users[1].profile.phone },
        trackingNumber: 'TRK987654321',
        trackingUrl: 'https://tracking.example.com/TRK987654321',
        estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        shippedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      // Shipped orders
      {
        userId: users[2]._id,
        email: users[2].email,
        productId: product.productId,
        productName: product.name,
        quantity: 6,
        pricePerBottle: 11.69, // 10% discount
        discount: { percentage: 10, code: null, amount: 7.74 },
        amount: 7014, // $70.14 in cents
        currency: 'usd',
        stripeSessionId: 'cs_test_shipped1',
        stripePaymentIntentId: 'pi_shipped1',
        status: 'shipped',
        shippingAddress: users[2].addresses[0],
        customerDetails: { name: users[2].profile.firstName + ' ' + users[2].profile.lastName, phone: users[2].profile.phone },
        trackingNumber: 'TRK456789123',
        trackingUrl: 'https://tracking.example.com/TRK456789123',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      // Processing orders
      {
        userId: users[3]._id,
        email: users[3].email,
        productId: product.productId,
        productName: product.name,
        quantity: 12,
        pricePerBottle: 10.39, // 20% discount with code
        discount: { percentage: 20, code: 'SUMMER20', amount: 31.08 },
        amount: 12468, // $124.68 in cents
        currency: 'usd',
        stripeSessionId: 'cs_test_processing1',
        stripePaymentIntentId: 'pi_processing1',
        status: 'processing',
        shippingAddress: users[3].addresses[0],
        customerDetails: { name: users[3].profile.firstName + ' ' + users[3].profile.lastName, phone: users[3].profile.phone },
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      // Pending order
      {
        userId: users[4]._id,
        email: users[4].email,
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        pricePerBottle: 12.99, // No discount
        discount: { percentage: 0, code: null, amount: 0 },
        amount: 1299, // $12.99 in cents
        currency: 'usd',
        stripeSessionId: 'cs_test_pending1',
        status: 'pending',
        createdAt: new Date()
      }
    ]);

    console.log(`✅ Created ${orders.length} orders\n`);

    // Update product inventory
    const totalBottlesSold = orders
      .filter(o => ['processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + o.quantity, 0);

    product.inventory -= totalBottlesSold;
    await product.save();
    console.log(`📊 Updated inventory: ${product.inventory} bottles remaining\n`);

    // ==============================================
    // SEED SUBSCRIPTIONS
    // ==============================================
    console.log('🔄 Seeding subscriptions...');

    const subscriptions = await Subscription.create([
      {
        userId: users[0]._id,
        email: users[0].email,
        planName: 'Regular',
        bottlesPerDelivery: 12,
        deliveriesPerMonth: 1,
        pricePerBottle: 11.04,
        monthlyTotal: 132.48,
        status: 'active',
        nextDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lastDeliveryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        deliveryHistory: [
          {
            orderId: orders[0]._id,
            deliveryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            quantity: 12,
            amount: 13248
          }
        ],
        stripeSubscriptionId: 'sub_active1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[1]._id,
        email: users[1].email,
        planName: 'Family',
        bottlesPerDelivery: 24,
        deliveriesPerMonth: 1,
        pricePerBottle: 9.74,
        monthlyTotal: 233.76,
        status: 'active',
        nextDeliveryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        lastDeliveryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        deliveryHistory: [
          {
            orderId: orders[1]._id,
            deliveryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            quantity: 24,
            amount: 24936
          }
        ],
        stripeSubscriptionId: 'sub_active2',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[2]._id,
        email: users[2].email,
        planName: 'Starter',
        bottlesPerDelivery: 6,
        deliveriesPerMonth: 1,
        pricePerBottle: 11.04,
        monthlyTotal: 66.24,
        status: 'paused',
        nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryHistory: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`✅ Created ${subscriptions.length} subscriptions\n`);

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
        title: 'Best juice I\'ve ever had!',
        comment: 'The taste is incredible and I feel so much more energized since I started drinking OLI. The subscription saves me money too. Highly recommend!',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulVotes: 47,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[1]._id,
        orderId: orders[1]._id,
        productId: product.productId,
        rating: 5,
        title: 'Amazing quality!',
        comment: 'Love that it\'s organic and cold-pressed. You can really taste the quality. My kids love it too! We\'ll be customers for life.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulVotes: 32,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[2]._id,
        orderId: orders[2]._id,
        productId: product.productId,
        rating: 5,
        title: 'Energy boost!',
        comment: 'I\'ve been drinking OLI for 6 months and my energy levels are through the roof. Plus it tastes amazing! Worth every penny.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulVotes: 28,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[3]._id,
        productId: product.productId,
        rating: 4,
        title: 'Great product, fast shipping',
        comment: 'The juice is delicious and very refreshing. Shipping was faster than expected. Only wish the bottles were a bit larger!',
        isApproved: true,
        isVerifiedPurchase: false,
        helpfulVotes: 15,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`✅ Created ${reviews.length} reviews\n`);

    // ==============================================
    // SEED ANALYTICS
    // ==============================================
    console.log('📊 Seeding analytics...');

    const analyticsEvents = [];

    // Generate sample analytics for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

      // Page views (10-50 per day)
      const pageViews = Math.floor(Math.random() * 40) + 10;
      for (let j = 0; j < pageViews; j++) {
        analyticsEvents.push({
          eventType: 'page_view',
          page: '/',
          timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        });
      }

      // Product views (5-20 per day)
      const productViews = Math.floor(Math.random() * 15) + 5;
      for (let j = 0; j < productViews; j++) {
        analyticsEvents.push({
          eventType: 'product_view',
          productId: product.productId,
          timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        });
      }

      // Add to cart (2-8 per day)
      const addToCarts = Math.floor(Math.random() * 6) + 2;
      for (let j = 0; j < addToCarts; j++) {
        analyticsEvents.push({
          eventType: 'add_to_cart',
          productId: product.productId,
          quantity: Math.floor(Math.random() * 24) + 1,
          timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        });
      }
    }

    await Analytics.insertMany(analyticsEvents);
    console.log(`✅ Created ${analyticsEvents.length} analytics events\n`);

    // ==============================================
    // SUMMARY
    // ==============================================
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Products: ${await Product.countDocuments()}`);
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Orders: ${await Order.countDocuments()}`);
    console.log(`   - Subscriptions: ${await Subscription.countDocuments()}`);
    console.log(`   - Reviews: ${await Review.countDocuments()}`);
    console.log(`   - Analytics Events: ${await Analytics.countDocuments()}`);
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
