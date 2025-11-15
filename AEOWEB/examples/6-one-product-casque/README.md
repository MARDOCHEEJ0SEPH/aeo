# SoundWave Pro - Single Product E-Commerce (Example 6)

A complete, production-ready single-product e-commerce website for selling the **SoundWave Pro Wireless Headset**. Features email authentication, Stripe payment integration, MongoDB database, and full AEO optimization.

## 🎯 Overview

This example demonstrates how to build a scalable, AEO-optimized single-product e-commerce site following AEOWEB 100% standards. Perfect for:

- **Single product launches** (headphones, courses, software, etc.)
- **Pre-order campaigns** with limited inventory
- **Direct-to-consumer brands** focused on one hero product
- **MVP e-commerce** testing product-market fit

## ✨ Features

### Frontend
- ✅ Fully responsive single-product landing page
- ✅ Product schema markup (JSON-LD) for AEO
- ✅ FAQ section optimized for voice search
- ✅ Customer reviews with aggregate ratings
- ✅ Email-based passwordless authentication
- ✅ Stripe Checkout integration
- ✅ Mobile-first design

### Backend
- ✅ RESTful API with Express.js
- ✅ MongoDB database with Mongoose ODM
- ✅ JWT-based authentication
- ✅ Stripe payment processing
- ✅ Webhook handling for order updates
- ✅ Order management system
- ✅ Sales analytics endpoints
- ✅ Security (Helmet, CORS, rate limiting)

### Database
- ✅ MongoDB collections: Users, Orders, Products
- ✅ Inventory tracking
- ✅ Order status management
- ✅ Customer relationship tracking

## 🚀 Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Stripe.js for payment processing

**Backend:**
- Node.js 18+
- Express.js 4.x
- Mongoose 8.x
- Stripe SDK 14.x
- JWT for authentication
- Helmet for security
- Express Rate Limit

**Database:**
- MongoDB 6.0+ (local or MongoDB Atlas)

## 📁 Project Structure

```
6-one-product-casque/
├── index.html              # Product landing page
├── pages/
│   ├── success.html       # Order confirmation page
│   └── cancel.html        # Checkout cancelled page
├── database/
│   ├── schema.js          # Mongoose schemas (centralized, no duplication)
│   └── seed.js            # Database seed script with sample data
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json       # Dependencies (includes seed script)
│   └── .env.example       # Environment variables template
└── README.md              # This file
```

**Note:** Following AEOWEB 100% standards - schemas are centralized in `database/schema.js` to avoid code duplication. The backend imports models from this centralized location.

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- MongoDB 6.0+ (local or Atlas)
- Stripe account (free test mode)
- npm or yarn

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:8080

# MongoDB (choose one)
# Local:
MONGODB_URI=mongodb://localhost:27017/soundwave-pro
# Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/soundwave-pro

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-generated-secret-key-here

# Stripe Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Stripe Webhook Secret (from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 3: Set Up MongoDB

**Option A: Local MongoDB**

```bash
# Install MongoDB (macOS)
brew install mongodb-community@6.0

# Start MongoDB
brew services start mongodb-community@6.0

# Verify it's running
mongosh
```

**Option B: MongoDB Atlas (Cloud)**

1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Add database user (Database Access)
4. Whitelist your IP (Network Access → Add IP Address → Allow Access from Anywhere)
5. Get connection string (Connect → Connect your application → Copy connection string)
6. Update `MONGODB_URI` in `.env` with your connection string

### Step 4: Configure Stripe

1. **Get API Keys:**
   - Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)
   - Update `.env` file

2. **Set Up Webhook:**
   - Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Click "+ Add endpoint"
   - Endpoint URL: `http://localhost:3000/api/webhooks/stripe` (for testing)
   - Events to send: Select these events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Click "Add endpoint"
   - Reveal and copy "Signing secret" (starts with `whsec_`)
   - Update `STRIPE_WEBHOOK_SECRET` in `.env`

3. **Update Frontend:**
   - Edit `index.html`
   - Replace `pk_test_YOUR_PUBLISHABLE_KEY` with your actual Stripe publishable key (line ~370)

### Step 4.5: Seed the Database (Optional but Recommended)

Populate your MongoDB database with sample data for development and testing:

```bash
# From backend directory
npm run seed
```

This will create:
- 1 Product (SoundWave Pro Wireless Headset with full specifications)
- 3 Sample users with profiles and addresses
- 3 Sample orders (completed, processing, pending)
- 3 Customer reviews (4-5 star ratings)

**Note:** The seed script will clear existing data first. Comment out the `deleteMany()` calls in `database/seed.js` if you want to keep existing data.

### Step 5: Start the Server

```bash
# From backend directory
npm start

# Or use nodemon for development (auto-restart)
npm run dev
```

Server should start on `http://localhost:3000`

### Step 6: Serve Frontend

**Option A: Using Python**
```bash
# From project root (6-one-product-casque/)
python3 -m http.server 8080
```

**Option B: Using Node.js http-server**
```bash
# Install globally
npm install -g http-server

# Run from project root
http-server -p 8080
```

**Option C: Using VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

Frontend should be accessible at `http://localhost:8080`

## 🧪 Testing

### Test the Complete Flow

1. **Open the website:** `http://localhost:8080`

2. **Click "Buy Now - $299.00"**
   - Auth modal should appear

3. **Enter your email** (use test email like `test@example.com`)
   - Click "Continue"
   - You should be authenticated

4. **Click "Buy Now" again**
   - Should redirect to Stripe Checkout

5. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

6. **Fill shipping address** and complete payment

7. **Success page** should display with order details

### Test Webhook Locally

For local webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret and update .env
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Email-based passwordless authentication.

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "email": "customer@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/api/auth/verify`
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "email": "customer@example.com"
  }
}
```

### Product Endpoints

#### GET `/api/product`
Get product details.

**Response:**
```json
{
  "_id": "60d5ec49f1b2c72b8c8e4f1b",
  "productId": "soundwave-pro-headset",
  "name": "SoundWave Pro Wireless Headset",
  "description": "Premium wireless headset...",
  "price": 29900,
  "currency": "usd",
  "inStock": true,
  "inventory": 95
}
```

### Checkout Endpoints

#### POST `/api/checkout/create-session`
Create Stripe Checkout session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

#### POST `/api/webhooks/stripe`
Stripe webhook handler (called by Stripe, not your frontend).

### Order Endpoints

#### GET `/api/orders`
Get all orders for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f1c",
    "email": "customer@example.com",
    "productName": "SoundWave Pro Wireless Headset",
    "amount": 29900,
    "status": "completed",
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
]
```

#### GET `/api/orders/:orderId`
Get single order details.

#### GET `/api/orders/session/:sessionId`
Get order by Stripe session ID (for success page).

### Analytics Endpoints

#### GET `/api/analytics/sales`
Get sales analytics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "totalOrders": 47,
  "totalRevenue": 1406300,
  "averageOrderValue": 29900
}
```

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  loginToken: String,
  tokenExpiry: Date,
  createdAt: Date,
  lastLogin: Date
}
```

### Orders Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  email: String,
  productId: String,
  productName: String,
  quantity: Number,
  amount: Number,
  currency: String,
  stripeSessionId: String,
  stripePaymentIntentId: String,
  status: String (pending | processing | completed | cancelled | refunded),
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
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection

```javascript
{
  _id: ObjectId,
  productId: String (unique),
  name: String,
  description: String,
  price: Number (in cents),
  currency: String,
  images: [String],
  inStock: Boolean,
  inventory: Number,
  stripePriceId: String
}
```

## 🔒 Security Features

- **Helmet.js:** Sets secure HTTP headers
- **CORS:** Configurable cross-origin resource sharing
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **JWT Authentication:** Secure token-based auth (7-day expiry)
- **Environment Variables:** Sensitive data not committed to repo
- **Stripe Webhook Signature Verification:** Ensures webhooks are from Stripe
- **MongoDB Injection Protection:** Mongoose sanitizes queries

## 🎨 Customization

### Change Product Details

Edit `index.html`:

```html
<!-- Update product name, price, description -->
<h1>Your Product Name</h1>

<!-- Update schema markup -->
<script type="application/ld+json">
{
  "@type": "Product",
  "name": "Your Product",
  "price": "199.00"
}
</script>
```

### Modify Color Scheme

Edit CSS variables in `index.html`:

```css
:root {
    --primary-color: #667eea;  /* Change to your brand color */
    --secondary-color: #764ba2;
}
```

### Add More Products

To expand beyond single product:

1. Update MongoDB `Product` schema with multiple products
2. Create product listing page
3. Modify checkout to accept `productId` parameter
4. Update Stripe line items to use dynamic products

## 📊 AEO Optimization

This example follows AEOWEB 100% AEO standards:

✅ **Product Schema Markup** - Rich snippets in search results
✅ **FAQ Section** - Answers common questions for voice search
✅ **Customer Reviews** - Social proof with aggregate ratings
✅ **Detailed Product Descriptions** - Natural language content
✅ **Semantic HTML** - Proper heading hierarchy
✅ **Mobile-First Design** - Optimized for all devices
✅ **Fast Load Times** - Minimal dependencies
✅ **Secure (HTTPS)** - Required for Stripe and trust signals

## 🚢 Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create soundwave-pro-api

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=...
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set FRONTEND_URL=https://yourdomain.com

# Deploy
git subtree push --prefix AEOWEB/examples/6-one-product-casque/backend heroku main

# Update Stripe webhook URL to: https://soundwave-pro-api.herokuapp.com/api/webhooks/stripe
```

### Frontend Deployment (Netlify/Vercel)

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd 6-one-product-casque
netlify deploy --prod

# Update API_URL in index.html to your Heroku backend URL
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### MongoDB Atlas (Production)

1. Upgrade to paid tier (M10+) for production workloads
2. Enable backups
3. Set up monitoring alerts
4. Use IP whitelist for security

## 🐛 Troubleshooting

### "MongoDB connection error"
- Verify MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env`
- For Atlas: Verify IP whitelist and credentials

### "Stripe webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### "CORS error" in browser console
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS configuration in `server.js`

### Order status stuck at "pending"
- Check webhook is configured correctly
- Verify webhook events include `checkout.session.completed`
- Check server logs for webhook errors

## 📈 Performance Optimization

- **Add Redis caching** for product details
- **Implement CDN** for static assets
- **Use MongoDB indexes** on frequently queried fields
- **Enable gzip compression** in Express
- **Lazy load images** below the fold
- **Implement service worker** for offline support

## 🔮 Future Enhancements

- [ ] Email notifications (order confirmation, shipping updates)
- [ ] Admin dashboard for order management
- [ ] Inventory alerts when stock is low
- [ ] Discount codes and promotions
- [ ] Multiple product variants (colors, sizes)
- [ ] Subscription billing option
- [ ] Customer reviews submission form
- [ ] Abandoned cart recovery emails
- [ ] Analytics dashboard (Google Analytics, Mixpanel)
- [ ] Multi-language support

## 📄 License

MIT License - feel free to use for commercial or personal projects.

## 🤝 Support

For questions or issues:
- Check existing GitHub issues
- Review Stripe documentation: [stripe.com/docs](https://stripe.com/docs)
- MongoDB documentation: [docs.mongodb.com](https://docs.mongodb.com)

---

**Built with ❤️ following AEOWEB standards for Answer Engine Optimization**
