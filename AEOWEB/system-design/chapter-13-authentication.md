# Chapter 13: Authentication

## Secure User Authentication Systems

Authentication verifies user identity. This chapter covers session-based auth, JWT tokens, OAuth 2.0, social login, multi-factor authentication, and complete secure implementations.

---

## Authentication Methods Overview

```
┌──────────────────────────────────────────────────┐
│         Authentication Methods                    │
├──────────────────────────────────────────────────┤
│                                                   │
│ 1. Session-Based                                  │
│    ├─ Server stores session                      │
│    ├─ Cookie contains session ID                 │
│    └─ Stateful (requires storage)                │
│                                                   │
│ 2. Token-Based (JWT)                              │
│    ├─ Self-contained tokens                      │
│    ├─ Client stores token                        │
│    └─ Stateless (no server storage)              │
│                                                   │
│ 3. OAuth 2.0                                      │
│    ├─ Third-party authentication                 │
│    ├─ Access and refresh tokens                  │
│    └─ Used for social login                      │
│                                                   │
│ 4. Multi-Factor (MFA)                             │
│    ├─ Multiple verification steps                │
│    ├─ SMS, Email, Authenticator apps             │
│    └─ Enhanced security                          │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Session-Based Authentication

### How It Works

```
┌─────────┐                                 ┌─────────┐
│ Client  │                                 │ Server  │
└────┬────┘                                 └────┬────┘
     │                                            │
     │ 1. POST /login (email, password)          │
     ├──────────────────────────────────────────>│
     │                                            │
     │                    2. Verify credentials   │
     │                    3. Create session       │
     │                    4. Store in Redis       │
     │                                            │
     │ 5. Set-Cookie: session_id=abc123          │
     │<──────────────────────────────────────────┤
     │                                            │
     │ 6. GET /api/profile                        │
     │    Cookie: session_id=abc123              │
     ├──────────────────────────────────────────>│
     │                                            │
     │                    7. Lookup session       │
     │                    8. Verify user          │
     │                                            │
     │ 9. Response with user data                │
     │<──────────────────────────────────────────┤
     │                                            │
```

### Complete Session Implementation

```javascript
// auth/session.js
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const bcrypt = require('bcrypt');
const { pool } = require('../database');

const app = express();

// Create Redis client
const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  legacyMode: true
});

redisClient.connect().catch(console.error);

// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Don't use default 'connect.sid'
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  }
}));

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, last_name, created_at`,
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }

    res.clearCookie('sessionId');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Get current user
app.get('/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

module.exports = { app, requireAuth };
```

---

## Token-Based Authentication (JWT)

### How JWT Works

```
┌─────────┐                                 ┌─────────┐
│ Client  │                                 │ Server  │
└────┬────┘                                 └────┬────┘
     │                                            │
     │ 1. POST /login (email, password)          │
     ├──────────────────────────────────────────>│
     │                                            │
     │                    2. Verify credentials   │
     │                    3. Generate JWT         │
     │                                            │
     │ 4. Response with token                    │
     │    { "token": "eyJhbGci..." }             │
     │<──────────────────────────────────────────┤
     │                                            │
     │ 5. Store token in localStorage            │
     │                                            │
     │ 6. GET /api/profile                        │
     │    Authorization: Bearer eyJhbGci...      │
     ├──────────────────────────────────────────>│
     │                                            │
     │                    7. Verify JWT signature │
     │                    8. Decode payload       │
     │                                            │
     │ 9. Response with user data                │
     │<──────────────────────────────────────────┤
     │                                            │
```

### JWT Structure

```
JWT Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjM2MjM2MjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Parts (separated by .):
1. Header: {"alg":"HS256","typ":"JWT"}
2. Payload: {"userId":123,"email":"user@example.com","iat":1636236222}
3. Signature: Encrypted hash of header + payload
```

### Complete JWT Implementation

```javascript
// auth/jwt.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../database');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

// Generate access token
function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Generate refresh token
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Check if exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, last_name`,
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    );

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, created_at) VALUES ($1, $2, NOW())',
      [user.id, refreshToken]
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Check if token exists in database
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
      [refreshToken, decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email);

    res.json({
      success: true,
      accessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

// Logout
app.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token
      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Get current user
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

module.exports = { app, authenticateToken };
```

---

## OAuth 2.0 and Social Login

### Google OAuth Implementation

```javascript
// auth/oauth-google.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../database');
const { generateAccessToken, generateRefreshToken } = require('./jwt');

const app = express();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get authorization URL
app.get('/auth/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent'
  });

  res.redirect(authUrl);
});

// Handle callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user
      result = await pool.query(
        `INSERT INTO users (email, google_id, first_name, last_name, avatar_url, email_verified)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id, email, first_name, last_name`,
        [email, googleId, given_name, family_name, picture]
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
    }

    // Generate our tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    );

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

module.exports = app;
```

---

## Multi-Factor Authentication (MFA)

### TOTP (Time-Based One-Time Password) Implementation

```javascript
// auth/mfa.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { pool } = require('../database');

// Enable MFA for user
async function enableMFA(userId, userEmail) {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `MyApp (${userEmail})`,
    issuer: 'MyApp'
  });

  // Store secret in database
  await pool.query(
    'UPDATE users SET mfa_secret = $1, mfa_enabled = false WHERE id = $2',
    [secret.base32, userId]
  );

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  };
}

// Verify and activate MFA
async function verifyAndActivateMFA(userId, token) {
  // Get user's secret
  const result = await pool.query(
    'SELECT mfa_secret FROM users WHERE id = $1',
    [userId]
  );

  const secret = result.rows[0].mfa_secret;

  // Verify token
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps before/after
  });

  if (verified) {
    // Activate MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = true WHERE id = $1',
      [userId]
    );

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Store hashed backup codes
    for (const code of backupCodes) {
      const hashedCode = await bcrypt.hash(code, 10);
      await pool.query(
        'INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES ($1, $2)',
        [userId, hashedCode]
      );
    }

    return { success: true, backupCodes };
  }

  return { success: false };
}

// Verify MFA token during login
async function verifyMFAToken(userId, token) {
  const result = await pool.query(
    'SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1',
    [userId]
  );

  const { mfa_secret, mfa_enabled } = result.rows[0];

  if (!mfa_enabled) {
    return false;
  }

  return speakeasy.totp.verify({
    secret: mfa_secret,
    encoding: 'base32',
    token,
    window: 2
  });
}

// Generate backup codes
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

module.exports = {
  enableMFA,
  verifyAndActivateMFA,
  verifyMFAToken
};
```

---

## Password Reset Flow

```javascript
// auth/password-reset.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { pool } = require('../database');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Request password reset
async function requestPasswordReset(email) {
  // Check if user exists
  const result = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    // Don't reveal if email exists
    return { success: true };
  }

  const userId = result.rows[0].id;

  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store token
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset.</p>
      <p>Click this link to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });

  return { success: true };
}

// Reset password
async function resetPassword(token, newPassword) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find valid token
  const result = await pool.query(
    `SELECT user_id FROM password_reset_tokens
    WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return { success: false, error: 'Invalid or expired token' };
  }

  const userId = result.rows[0].user_id;

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );

  // Mark token as used
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
    [tokenHash]
  );

  // Invalidate all refresh tokens
  await pool.query(
    'DELETE FROM refresh_tokens WHERE user_id = $1',
    [userId]
  );

  return { success: true };
}

module.exports = {
  requestPasswordReset,
  resetPassword
};
```

---

## Key Takeaways

✅ **Session-based** is simple but requires server storage
✅ **JWT** is stateless and scalable
✅ **OAuth 2.0** enables social login
✅ **MFA** significantly improves security
✅ **Password reset** requires secure token handling
✅ **Always hash passwords** with bcrypt
✅ **Use HTTPS** in production
✅ **Implement rate limiting** on auth endpoints

---

## Implementation Checklist

- [ ] Choose authentication method
- [ ] Implement registration
- [ ] Implement login
- [ ] Add password hashing (bcrypt)
- [ ] Implement logout
- [ ] Add authentication middleware
- [ ] Implement token refresh (JWT)
- [ ] Add password reset flow
- [ ] Implement MFA (optional)
- [ ] Add social login (optional)
- [ ] Set secure cookie options
- [ ] Add rate limiting
- [ ] Test authentication flow

---

## What's Next

Chapter 14 covers Authorization—implementing role-based and attribute-based access control.

**[Continue to Chapter 14: Authorization →](chapter-14-authorization.md)**

---

**Navigation:**
- [← Back: Chapter 12](chapter-12-graphql.md)
- [→ Next: Chapter 14](chapter-14-authorization.md)
- [Home](README.md)

---

*Chapter 13 of 15 | AEOWEB System Design Guide*
*Updated November 2025*
