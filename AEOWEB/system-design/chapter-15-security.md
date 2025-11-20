# Chapter 15: Security Best Practices

## Building Secure Production Systems

Security is not optional—it's essential. This chapter covers OWASP Top 10, input validation, XSS/CSRF protection, password security, HTTPS setup, and complete security implementations.

---

## OWASP Top 10 (2021)

```
┌────────────────────────────────────────────────────┐
│            OWASP Top 10 Web Vulnerabilities        │
├────────────────────────────────────────────────────┤
│                                                     │
│ 1. Broken Access Control                           │
│ 2. Cryptographic Failures                          │
│ 3. Injection                                        │
│ 4. Insecure Design                                  │
│ 5. Security Misconfiguration                        │
│ 6. Vulnerable and Outdated Components              │
│ 7. Identification and Authentication Failures      │
│ 8. Software and Data Integrity Failures            │
│ 9. Security Logging and Monitoring Failures        │
│ 10. Server-Side Request Forgery (SSRF)             │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 1. SQL Injection Prevention

### Vulnerable Code (NEVER DO THIS)

```javascript
// ❌ VULNERABLE to SQL injection
app.get('/users/:id', async (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  const result = await pool.query(query);
  res.json(result.rows);
});

// Attack: /users/1 OR 1=1--
// Query becomes: SELECT * FROM users WHERE id = 1 OR 1=1--
// Returns all users!
```

### Secure Code (DO THIS)

```javascript
// ✅ SAFE - Using parameterized queries
app.get('/users/:id', async (req, res) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [req.params.id]);
  res.json(result.rows);
});

// Attack attempt: /users/1 OR 1=1--
// Treated as literal string, not SQL code
```

### Complete Input Validation

```javascript
// validation/sanitize.js
const validator = require('validator');

class InputValidator {
  static sanitizeString(input, maxLength = 255) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Trim whitespace
    let sanitized = input.trim();

    // Limit length
    sanitized = sanitized.substring(0, maxLength);

    // Escape HTML
    sanitized = validator.escape(sanitized);

    return sanitized;
  }

  static validateEmail(email) {
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }

    return validator.normalizeEmail(email);
  }

  static validateInteger(input, min = null, max = null) {
    const num = parseInt(input);

    if (isNaN(num)) {
      throw new Error('Must be a valid integer');
    }

    if (min !== null && num < min) {
      throw new Error(`Must be at least ${min}`);
    }

    if (max !== null && num > max) {
      throw new Error(`Must be at most ${max}`);
    }

    return num;
  }

  static validateURL(url) {
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      throw new Error('Invalid URL');
    }

    return url;
  }

  static sanitizeSQL(input) {
    // Always use parameterized queries
    // This is just for extra safety
    return String(input).replace(/['";\\]/g, '');
  }

  static validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      throw new Error('Password must contain special character');
    }

    return password;
  }
}

module.exports = InputValidator;
```

---

## 2. XSS (Cross-Site Scripting) Protection

### Types of XSS

```javascript
// 1. Stored XSS (Persistent)
// Malicious script stored in database
const comment = "<script>alert('XSS')</script>";
// Gets executed when page loads

// 2. Reflected XSS
// Script in URL parameter
// URL: /search?q=<script>alert('XSS')</script>

// 3. DOM-based XSS
// Client-side script manipulation
// innerHTML = userInput; // Dangerous!
```

### XSS Prevention

```javascript
// security/xss-prevention.js
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

class XSSProtection {
  // Sanitize HTML content
  static sanitizeHTML(dirty) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href']
    });
  }

  // Escape HTML entities
  static escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return text.replace(/[&<>"'/]/g, char => map[char]);
  }

  // Content Security Policy header
  static getCSPHeader() {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    };
  }
}

// Express middleware
app.use((req, res, next) => {
  // Set CSP header
  const csp = XSSProtection.getCSPHeader();
  res.set(csp);
  next();
});

module.exports = XSSProtection;
```

---

## 3. CSRF (Cross-Site Request Forgery) Protection

### How CSRF Works

```
1. User logs into bank.com
2. User visits evil.com (without logging out)
3. evil.com has hidden form:
   <form action="https://bank.com/transfer" method="POST">
     <input name="to" value="attacker">
     <input name="amount" value="1000">
   </form>
   <script>document.forms[0].submit();</script>
4. Form submits with user's cookies
5. Bank transfers money to attacker!
```

### CSRF Prevention

```javascript
// security/csrf.js
const crypto = require('crypto');

class CSRFProtection {
  constructor() {
    this.tokens = new Map();
  }

  // Generate CSRF token
  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokens.set(sessionId, token);

    // Auto-expire after 1 hour
    setTimeout(() => {
      this.tokens.delete(sessionId);
    }, 3600000);

    return token;
  }

  // Verify CSRF token
  verifyToken(sessionId, token) {
    const validToken = this.tokens.get(sessionId);
    return validToken === token;
  }

  // Middleware to inject token
  injectToken() {
    return (req, res, next) => {
      if (!req.session.csrfToken) {
        req.session.csrfToken = this.generateToken(req.sessionID);
      }

      res.locals.csrfToken = req.session.csrfToken;
      next();
    };
  }

  // Middleware to verify token
  verifyCSRF() {
    return (req, res, next) => {
      // Skip GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = req.body._csrf || req.headers['x-csrf-token'];

      if (!token || !this.verifyToken(req.sessionID, token)) {
        return res.status(403).json({
          success: false,
          error: 'Invalid CSRF token'
        });
      }

      next();
    };
  }
}

// Usage
const csrf = new CSRFProtection();

app.use(csrf.injectToken());
app.post('/api/*', csrf.verifyCSRF());

// In forms:
// <input type="hidden" name="_csrf" value="<%= csrfToken %>">

// In AJAX:
// headers: { 'X-CSRF-Token': csrfToken }

module.exports = CSRFProtection;
```

---

## 4. Password Security

### Password Hashing with bcrypt

```javascript
// security/password.js
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

class PasswordSecurity {
  // Hash password
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Check password strength
  static checkStrength(password) {
    const result = zxcvbn(password);

    return {
      score: result.score, // 0-4
      feedback: result.feedback,
      crackTimeSeconds: result.crack_times_seconds.offline_slow_hashing_1e4_per_second,
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions
    };
  }

  // Validate password requirements
  static validate(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain special character');
    }

    // Check common passwords
    const commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate secure random password
  static generateSecure(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }
}

module.exports = PasswordSecurity;
```

---

## 5. Rate Limiting

### Comprehensive Rate Limiting

```javascript
// security/rate-limit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

// General API rate limit
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for authentication
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  }
});

// Stricter limit for password reset
const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:reset:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Too many password reset requests, please try again later'
  }
});

// Custom rate limit by user ID
const createUserLimiter = (maxRequests, windowMs) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const key = `rl:user:${req.user.userId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000));
    }

    if (count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded for your account'
      });
    }

    next();
  };
};

// Usage
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  createUserLimiter
};
```

---

## 6. Security Headers with Helmet

```javascript
// security/headers.js
const helmet = require('helmet');

// Complete helmet configuration
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // HSTS - Force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // Prevent MIME sniffing
  noSniff: true,

  // XSS Protection
  xssFilter: true,

  // Hide X-Powered-By
  hidePoweredBy: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'no-referrer-when-downgrade'
  }
}));

// Additional security headers
app.use((req, res, next) => {
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Expect-CT
  res.setHeader('Expect-CT', 'max-age=86400, enforce');

  next();
});
```

---

## 7. HTTPS/TLS Setup

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d example.com -d www.example.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # SSL Session Cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 8. Environment Variables and Secrets

### Secure Configuration Management

```javascript
// config/secrets.js
const fs = require('fs');
const path = require('path');

class SecretsManager {
  constructor() {
    this.secrets = {};
    this.loadSecrets();
  }

  loadSecrets() {
    // Load from environment variables
    this.secrets = {
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        expiry: process.env.JWT_EXPIRY || '7d'
      },
      session: {
        secret: process.env.SESSION_SECRET
      },
      email: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS
      }
    };

    // Validate required secrets
    this.validate();
  }

  validate() {
    const required = [
      'DB_PASSWORD',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Check secret strength
    if (process.env.JWT_SECRET.length < 32) {
      console.warn('⚠️  JWT_SECRET should be at least 32 characters');
    }
  }

  get(path) {
    const parts = path.split('.');
    let value = this.secrets;

    for (const part of parts) {
      value = value[part];
      if (value === undefined) {
        throw new Error(`Secret not found: ${path}`);
      }
    }

    return value;
  }
}

module.exports = new SecretsManager();
```

### .env.example Template

```bash
# .env.example
# Copy to .env and fill in your values

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db
DB_USER=myapp_user
DB_PASSWORD=change_this_secure_password

# JWT
JWT_SECRET=change_this_to_random_32_character_string
JWT_EXPIRY=7d

# Session
SESSION_SECRET=change_this_to_another_random_string

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
```

---

## 9. Security Logging and Monitoring

```javascript
// security/audit-log.js
const { pool } = require('../database');

class AuditLog {
  static async logEvent(event) {
    const {
      userId,
      action,
      resource,
      resourceId,
      ip,
      userAgent,
      success,
      errorMessage
    } = event;

    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id,
        ip_address, user_agent, success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, action, resource, resourceId, ip, userAgent, success, errorMessage]
    );
  }

  static async logLogin(userId, ip, userAgent, success, reason = null) {
    await this.logEvent({
      userId,
      action: 'login',
      resource: 'auth',
      ip,
      userAgent,
      success,
      errorMessage: reason
    });

    // Alert on failed login attempts
    if (!success) {
      const recentFailures = await pool.query(
        `SELECT COUNT(*) as count FROM audit_logs
        WHERE user_id = $1 AND action = 'login' AND success = false
        AND created_at > NOW() - INTERVAL '15 minutes'`,
        [userId]
      );

      if (parseInt(recentFailures.rows[0].count) >= 5) {
        // Send alert
        console.log(`🚨 Multiple failed login attempts for user ${userId}`);
        // Send email/SMS alert
      }
    }
  }

  static async logDataAccess(userId, resource, resourceId, action, ip) {
    await this.logEvent({
      userId,
      action,
      resource,
      resourceId,
      ip,
      success: true
    });
  }
}

module.exports = AuditLog;
```

---

## 10. Complete Security Checklist

```javascript
// Complete security implementation
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiLimiter, authLimiter } = require('./security/rate-limit');
const CSRFProtection = require('./security/csrf');
const XSSProtection = require('./security/xss-prevention');

const app = express();

// 1. Security Headers
app.use(helmet());
app.set(XSSProtection.getCSPHeader());

// 2. CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

// 3. Rate Limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// 4. CSRF Protection
const csrf = new CSRFProtection();
app.use(csrf.injectToken());
app.post('/api/*', csrf.verifyCSRF());

// 5. Body Parsing (with size limits)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 7. Security Middleware
app.use((req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');

  // Prevent caching of sensitive data
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }

  next();
});

// Your routes here...

// 8. Error Handling (don't leak info)
app.use((err, req, res, next) => {
  console.error(err);

  // Don't send error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } else {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});
```

---

## Key Takeaways

✅ **Always use parameterized queries** to prevent SQL injection
✅ **Sanitize all user input** to prevent XSS
✅ **Implement CSRF protection** for state-changing operations
✅ **Use bcrypt** for password hashing
✅ **Implement rate limiting** to prevent abuse
✅ **Use HTTPS** in production (Let's Encrypt is free)
✅ **Set security headers** with Helmet.js
✅ **Never commit secrets** to version control
✅ **Log security events** for monitoring
✅ **Keep dependencies updated** to patch vulnerabilities

---

## Security Implementation Checklist

- [ ] Use parameterized SQL queries
- [ ] Sanitize all user input
- [ ] Implement XSS protection
- [ ] Add CSRF tokens
- [ ] Hash passwords with bcrypt
- [ ] Implement rate limiting
- [ ] Set up HTTPS/SSL
- [ ] Configure security headers (Helmet)
- [ ] Validate all input server-side
- [ ] Store secrets in environment variables
- [ ] Implement audit logging
- [ ] Add intrusion detection
- [ ] Set up automated security scanning
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Implement backup strategy
- [ ] Create incident response plan
- [ ] Train team on security practices

---

## Conclusion

Security is an ongoing process, not a one-time implementation. Stay updated on new vulnerabilities, regularly audit your code, and always assume that attackers are trying to break your system.

**Remember:** It's always cheaper to build security in from the start than to add it later after a breach.

---

## Additional Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Security Headers: https://securityheaders.com/
- Mozilla Observatory: https://observatory.mozilla.org/
- npm audit: `npm audit` and `npm audit fix`
- Snyk: https://snyk.io/ (vulnerability scanning)

---

**Navigation:**
- [← Back: Chapter 14](chapter-14-authorization.md)
- [Home](README.md)

---

*Chapter 15 of 15 | AEOWEB System Design Guide*
*Updated November 2025*

---

## Congratulations!

You've completed the AEOWEB System Design Guide! You now have comprehensive knowledge of:

- System design fundamentals
- Database selection and optimization
- Scaling strategies
- Load balancing and health checks
- Eliminating single points of failure
- API design and protocols
- Authentication and authorization
- Security best practices

**Next Steps:**
1. Apply these concepts to your AEOWEB projects
2. Build and deploy a complete system
3. Monitor and optimize based on real-world usage
4. Share your knowledge with others

**Keep Learning:**
- Read case studies from companies at scale
- Practice system design interviews
- Contribute to open-source projects
- Stay updated on emerging technologies

Happy building! 🚀
