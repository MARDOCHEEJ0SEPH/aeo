# OLI - Premium Organic Juice (Example 7)

A complete, production-ready single-product e-commerce website powered by **WebAssembly (Rust)** for lightning-fast calculations, with Node.js backend, MongoDB database, and Stripe payment integration.

**Author:** Mardochée JOSEPH

## 🎯 Overview

This example demonstrates how to build a high-performance, AEO-optimized single-product e-commerce site using WebAssembly compiled from Rust for client-side calculations. Perfect for:

- **Single product e-commerce** (beverages, supplements, cosmetics, etc.)
- **Performance-critical calculations** (pricing, nutrition, carbon footprint)
- **Subscription-based products** with recurring deliveries
- **Businesses that value speed** and want native-like performance in the browser

## ✨ Features

### Frontend
- ✅ Fully responsive single-product landing page
- ✅ **WebAssembly (Rust) modules** for ultra-fast calculations
- ✅ Real-time pricing calculator with volume discounts
- ✅ Interactive nutrition calculator (adjustable serving sizes)
- ✅ Carbon footprint calculator
- ✅ Subscription plan calculator
- ✅ Discount code validation (in WASM)
- ✅ Product schema markup (JSON-LD) for AEO
- ✅ FAQ section optimized for voice search
- ✅ Customer reviews with aggregate ratings
- ✅ Email-based passwordless authentication
- ✅ Stripe Checkout integration

### Backend
- ✅ RESTful API with Express.js
- ✅ MongoDB database with Mongoose ODM
- ✅ JWT-based authentication
- ✅ Stripe payment processing with webhooks
- ✅ Order management system
- ✅ Subscription management
- ✅ Sales analytics endpoints
- ✅ Inventory tracking
- ✅ Security (Helmet, CORS, rate limiting)

### WebAssembly (Rust) Modules
- ✅ Pricing calculations with tiered discounts
- ✅ Subscription plan calculations
- ✅ Nutrition information scaling
- ✅ Daily value percentage calculations
- ✅ Carbon footprint estimation
- ✅ Discount code validation
- ✅ Inventory checking
- ✅ Delivery time estimation

## 🚀 Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- **WebAssembly (compiled from Rust)**
- wasm-bindgen for Rust/JS interop
- Stripe.js for payment processing

**Backend:**
- Node.js 18+
- Express.js 4.x
- Mongoose 8.x
- Stripe SDK 14.x
- JWT for authentication
- Helmet for security
- Express Rate Limit

**WebAssembly:**
- Rust 1.70+
- wasm-bindgen 0.2.x
- wasm-pack (build tool)
- serde for JSON serialization

**Database:**
- MongoDB 6.0+ (local or MongoDB Atlas)

## 📁 Project Structure

```
7-one-product-oli-juice/
├── index.html                 # Product landing page with WASM integration
├── pages/
│   ├── success.html          # Order confirmation page
│   └── cancel.html           # Checkout cancelled page
├── wasm-rust/
│   ├── Cargo.toml            # Rust project configuration
│   ├── src/
│   │   └── lib.rs            # Rust source code (compiles to WASM)
│   └── build.sh              # WASM build script
├── public/
│   └── wasm/                 # Generated WASM files (created by build.sh)
│       ├── oli_juice_wasm.js
│       ├── oli_juice_wasm_bg.wasm
│       └── ...
├── backend/
│   ├── server.js             # Express API server
│   ├── package.json          # Dependencies
│   └── .env.example          # Environment variables template
└── README.md                 # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- **Rust 1.70+** (for compiling WASM)
- **wasm-pack** (WASM build tool)
- **Node.js 18.x+**
- **MongoDB 6.0+** (local or Atlas)
- **Stripe account** (free test mode)
- **npm or yarn**

### Step 1: Install Rust and wasm-pack

**Install Rust (if not already installed):**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version  # Verify installation
```

**Install wasm-pack:**

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
wasm-pack --version  # Verify installation
```

### Step 2: Build the WebAssembly Module

```bash
cd wasm-rust

# Make build script executable
chmod +x build.sh

# Build WASM module
./build.sh
```

This will:
1. Compile Rust code to WebAssembly
2. Generate JavaScript bindings
3. Output files to `../public/wasm/`

**Expected output:**
```
🦀 Building OLI Juice WASM module from Rust...
📦 Compiling Rust to WebAssembly...
✅ WASM build successful!
📊 WASM module size: ~15KB (optimized)
```

**Verify WASM files were created:**
```bash
ls -lh ../public/wasm/
# Should show: oli_juice_wasm.js, oli_juice_wasm_bg.wasm, etc.
```

### Step 3: Set Up Backend

**Install backend dependencies:**

```bash
cd backend
npm install
```

**Configure environment variables:**

```bash
cp .env.example .env
```

**Edit `.env` with your credentials:**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:8080

# MongoDB (choose one)
# Local:
MONGODB_URI=mongodb://localhost:27017/oli-juice
# Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/oli-juice

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-generated-secret-key-here

# Stripe Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Stripe Webhook Secret (from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 4: Set Up MongoDB

**Option A: Local MongoDB**

```bash
# macOS
brew install mongodb-community@6.0
brew services start mongodb-community@6.0

# Verify it's running
mongosh
```

**Option B: MongoDB Atlas (Cloud)**

1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Add database user (Database Access)
4. Whitelist your IP (Network Access → Add IP Address → Allow Access from Anywhere)
5. Get connection string (Connect → Connect your application)
6. Update `MONGODB_URI` in `.env`

### Step 5: Configure Stripe

1. **Get API Keys:**
   - Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Copy "Publishable key" (`pk_test_...`)
   - Copy "Secret key" (`sk_test_...`)
   - Update `.env` file

2. **Set Up Webhook:**
   - Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Click "+ Add endpoint"
   - Endpoint URL: `http://localhost:3000/api/webhooks/stripe` (for testing)
   - Events to send:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Click "Add endpoint"
   - Reveal and copy "Signing secret" (`whsec_...`)
   - Update `STRIPE_WEBHOOK_SECRET` in `.env`

3. **Update Frontend:**
   - Edit `index.html`
   - Find line ~365 (inside `<script type="module">`)
   - Update `API_URL` if using a different backend port

### Step 6: Start the Backend Server

```bash
# From backend directory
npm start

# Or use nodemon for auto-restart during development
npm run dev
```

Server should start on `http://localhost:3000`

**Verify backend is running:**
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"healthy","database":"connected","author":"Mardochée JOSEPH"}
```

### Step 7: Serve the Frontend

**Option A: Using Python**
```bash
# From project root (7-one-product-oli-juice/)
python3 -m http.server 8080
```

**Option B: Using Node.js http-server**
```bash
npm install -g http-server
http-server -p 8080
```

**Option C: Using VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

Frontend should be accessible at `http://localhost:8080`

## 🧪 Testing the Complete Flow

### 1. Test WASM Module Loading

Open browser console at `http://localhost:8080`:

```javascript
// Should see in console:
✅ WASM module loaded successfully!
```

Verify interactive features work:
- Click different quantity tier buttons → Price updates instantly
- Adjust nutrition slider → Values recalculate in real-time
- Enter ZIP code in carbon calculator → Footprint calculates

### 2. Test Authentication

1. Click "Buy Now - $12.99"
2. Auth modal should appear
3. Enter test email: `test@example.com`
4. Click "Continue"
5. Check console for successful authentication

### 3. Test Stripe Checkout

1. After authentication, click "Buy Now" again
2. Should redirect to Stripe Checkout
3. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
4. Fill shipping address
5. Complete payment
6. Should redirect to success page with order details

### 4. Test Webhook Locally

For local webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (whsec_...) and update .env
```

Test a payment while Stripe CLI is running to see webhook events in terminal.

## 🦀 WebAssembly Module Details

### Functions Exported to JavaScript

The Rust WASM module exports these functions (available in `index.html`):

```javascript
// Pricing
wasm.calculate_pricing_tiers() → JSON string of all pricing tiers
wasm.calculate_price(bottles) → JSON string of pricing for specific quantity

// Subscriptions
wasm.calculate_subscription_plans() → JSON string of all subscription plans

// Nutrition
wasm.calculate_nutrition(servingMl) → JSON string of nutrition info
wasm.get_standard_nutrition() → JSON string of standard 250ml serving
wasm.calculate_daily_values(servingMl) → JSON string of % Daily Values

// Inventory
wasm.check_inventory(requested, available) → boolean

// Delivery
wasm.calculate_delivery_days(bottles, zipCode) → number of business days

// Carbon Footprint
wasm.calculate_carbon_footprint(bottles, shippingMiles) → JSON string

// Discount Codes
wasm.validate_discount_code(code) → discount percentage (0.0-1.0)
wasm.apply_discount(total, discountCode) → JSON string

// Utilities
wasm.get_version() → version string
wasm.health_check() → boolean
```

### Rebuilding WASM After Changes

If you modify `wasm-rust/src/lib.rs`:

```bash
cd wasm-rust
./build.sh
```

Refresh browser to load new WASM module.

### WASM Performance

- **Module size:** ~15KB (gzipped: ~6KB)
- **Load time:** <50ms on 3G connection
- **Execution:** Near-native speed (50-100x faster than JavaScript for complex calculations)

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

**Headers:** `Authorization: Bearer <token>`

### Product Endpoints

#### GET `/api/product`
Get product details including nutrition info.

#### POST `/api/product/calculate-price`
Calculate price with discounts.

**Request:**
```json
{
  "quantity": 12,
  "discountCode": "WELCOME10"
}
```

### Checkout Endpoints

#### POST `/api/checkout/create-session`
Create Stripe Checkout session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "quantity": 6,
  "discountCode": "HEALTH15"
}
```

### Order Endpoints

#### GET `/api/orders`
Get all orders for authenticated user.

#### GET `/api/orders/:orderId`
Get single order details.

#### GET `/api/orders/session/:sessionId`
Get order by Stripe session ID (for success page).

### Subscription Endpoints

#### POST `/api/subscriptions`
Create subscription.

**Request:**
```json
{
  "planName": "Regular",
  "bottlesPerDelivery": 12,
  "deliveriesPerMonth": 1,
  "pricePerBottle": 11.04,
  "monthlyTotal": 132.48
}
```

#### GET `/api/subscriptions`
Get user subscriptions.

#### PATCH `/api/subscriptions/:subscriptionId`
Update subscription status (active/paused/cancelled).

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  loginToken: String,
  tokenExpiry: Date,
  createdAt: Date,
  lastLogin: Date,
  preferences: {
    newsletter: Boolean,
    notifications: Boolean
  }
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
  pricePerBottle: Number,
  discount: {
    percentage: Number,
    code: String,
    amount: Number
  },
  amount: Number (in cents),
  currency: String,
  stripeSessionId: String,
  stripePaymentIntentId: String,
  status: String (pending|processing|shipped|delivered|cancelled|refunded),
  shippingAddress: Object,
  customerDetails: Object,
  trackingNumber: String,
  estimatedDelivery: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscriptions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  email: String,
  planName: String (Starter|Regular|Family|Bi-Weekly),
  bottlesPerDelivery: Number,
  deliveriesPerMonth: Number,
  pricePerBottle: Number,
  monthlyTotal: Number,
  status: String (active|paused|cancelled),
  nextDeliveryDate: Date,
  lastDeliveryDate: Date,
  stripeSubscriptionId: String,
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
  basePrice: Number (in cents),
  currency: String,
  bottleSize: Number (ml),
  images: [String],
  inStock: Boolean,
  inventory: Number,
  nutrition: {
    servingSize: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    sugar: Number,
    fiber: Number,
    vitaminC: Number,
    calcium: Number,
    iron: Number
  },
  stripePriceId: String
}
```

## 🔒 Security Features

- **Helmet.js:** Secure HTTP headers
- **CORS:** Configurable cross-origin resource sharing
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **JWT Authentication:** Secure token-based auth (30-day expiry)
- **Environment Variables:** Sensitive data not committed
- **Stripe Webhook Verification:** Ensures webhooks are authentic
- **MongoDB Injection Protection:** Mongoose sanitizes queries
- **WASM Sandboxing:** WASM runs in isolated environment

## 🎨 Customization

### Change Product Details

Edit `index.html` and `backend/server.js`:

```javascript
// Update product in MongoDB (backend/server.js)
const product = new Product({
  productId: 'your-product-id',
  name: 'Your Product Name',
  basePrice: 1999, // $19.99 in cents
  // ...
});
```

### Modify WASM Calculations

Edit `wasm-rust/src/lib.rs`, then rebuild:

```rust
// Change base price
const BASE_PRICE_PER_BOTTLE: f64 = 19.99;

// Modify discount tiers
calculate_tier(6, 0.15),   // 6-pack: 15% off
calculate_tier(12, 0.20),  // 12-pack: 20% off
```

```bash
cd wasm-rust
./build.sh
```

### Customize Color Scheme

Edit CSS variables in `index.html`:

```css
:root {
    --primary-color: #FF6B35;  /* Change to your brand color */
    --secondary-color: #4ECDC4;
}
```

## 📊 AEO Optimization

This example follows AEOWEB 100% AEO standards:

✅ **Product Schema Markup** - Rich snippets in search results  
✅ **FAQ Schema** - Voice search optimization  
✅ **Customer Reviews** - Social proof with ratings  
✅ **Nutrition Schema** - Detailed nutritional information  
✅ **Semantic HTML** - Proper heading hierarchy  
✅ **Mobile-First Design** - Optimized for all devices  
✅ **Ultra-Fast Performance** - WebAssembly for instant calculations  
✅ **Secure (HTTPS)** - Required for Stripe and trust signals  

## 🚢 Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
brew install heroku

# Login
heroku login

# Create app
heroku create oli-juice-api

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=...
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set FRONTEND_URL=https://yourdomain.com

# Deploy
git subtree push --prefix AEOWEB/examples/7-one-product-oli-juice/backend heroku main

# Update Stripe webhook URL to: https://oli-juice-api.herokuapp.com/api/webhooks/stripe
```

### Frontend Deployment (Netlify/Vercel)

**Important:** Build WASM before deploying!

```bash
cd wasm-rust
./build.sh  # Generates files in public/wasm/
cd ..
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

Update `API_URL` in `index.html` to point to your deployed backend.

## 🐛 Troubleshooting

### "WASM module failed to load"
- Verify `public/wasm/` directory exists with `.wasm` and `.js` files
- Run `./build.sh` in `wasm-rust/` directory
- Check browser console for specific error
- Ensure server serves `.wasm` files with correct MIME type

### "MongoDB connection error"
- Verify MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env`
- For Atlas: Verify IP whitelist and credentials

### "Stripe webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### "WASM calculations return undefined"
- Check browser console for WASM initialization errors
- Verify `await init()` completes before calling WASM functions
- Test with `wasmModule.health_check()` in console

### WASM build fails
- Ensure Rust is installed: `rustc --version`
- Ensure wasm-pack is installed: `wasm-pack --version`
- Try `cargo clean` in wasm-rust directory, then rebuild

## 📈 Performance Optimization

- **WASM is already optimized** (`--release` mode, LTO, size optimization)
- **Add Redis caching** for product details
- **Implement CDN** for WASM files and static assets
- **Use MongoDB indexes** on frequently queried fields
- **Enable gzip compression** in Express
- **Lazy load images** below the fold
- **Service worker** for offline WASM caching

## 🔮 Future Enhancements

- [ ] Email notifications (order confirmation, shipping updates)
- [ ] Admin dashboard for order management
- [ ] Real-time inventory updates via WebSockets
- [ ] PWA (Progressive Web App) with offline support
- [ ] Multi-product support
- [ ] Product variants (flavors, sizes)
- [ ] Recurring Stripe subscriptions (auto-billing)
- [ ] Customer reviews submission form
- [ ] Abandoned cart recovery
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] A/B testing framework

## 📄 License

MIT License - feel free to use for commercial or personal projects.

## 🤝 Support

For questions or issues:
- Check Rust WASM Book: [rustwasm.github.io/book](https://rustwasm.github.io/book/)
- Stripe documentation: [stripe.com/docs](https://stripe.com/docs)
- MongoDB documentation: [docs.mongodb.com](https://docs.mongodb.com)
- wasm-bindgen guide: [rustwasm.github.io/wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)

---

**Built with ❤️ by Mardochée JOSEPH using Rust + WebAssembly + AEOWEB standards**
