# Security Guide for AEO Website

## Critical Security Practices

### Environment Variables (.env) Security

#### ⚠️ NEVER COMMIT .env FILES TO GIT

**.env files contain sensitive information:**
- Database passwords
- API keys
- Secret keys for encryption
- Third-party service credentials
- Private tokens

#### Protection Steps

**1. Verify .gitignore is Working**

```bash
# Check if .gitignore exists
cat .gitignore

# Verify .env is ignored
git status

# .env should NOT appear in untracked files
```

**2. Check Existing Commits**

```bash
# Search git history for .env files
git log --all --full-history -- "*/.env"

# If found, remove from history (DANGER: rewrites history)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch **/.env' \
  --prune-empty --tag-name-filter cat -- --all
```

**3. Generate Secure Secrets**

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64

# For session secrets
openssl rand -base64 32
```

**4. Use Environment-Specific Files**

```
.env.example         # Template (commit this)
.env                 # Local development (NEVER commit)
.env.production      # Production (stored securely on server)
.env.test            # Testing environment
```

#### .env.example Best Practices

✅ **DO include in .env.example:**
- Key names
- Format examples
- Required vs optional variables
- Comments explaining purpose

❌ **DO NOT include in .env.example:**
- Real values
- Actual passwords
- Real API keys
- Production URLs

**Example .env.example:**
```env
# Database Configuration
DB_HOST=localhost                    # Database host
DB_PORT=5432                         # PostgreSQL port
DB_NAME=database_name                # Your database name
DB_USER=database_user                # Database username
DB_PASSWORD=CHANGE_ME_SECURE_PASS    # GENERATE SECURE PASSWORD

# Security - CHANGE ALL OF THESE!
JWT_SECRET=GENERATE_WITH_CRYPTO_RANDOMYTES_64
SESSION_SECRET=GENERATE_WITH_OPENSSL_RAND
```

### Production Environment Variables Management

#### Option 1: Server Environment Variables (Recommended)

**DigitalOcean/AWS/VPS:**
```bash
# Add to ~/.bashrc or ~/.profile
export DB_PASSWORD="your_secure_password"
export JWT_SECRET="your_jwt_secret"

# Reload
source ~/.bashrc

# Verify
echo $DB_PASSWORD  # Should show value
```

**For PM2 (Node.js):**
```bash
# Use ecosystem file
pm2 ecosystem
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'aeo-backend',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      DB_PASSWORD: process.env.DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET
    }
  }]
}
```

#### Option 2: Secret Management Services

**AWS Secrets Manager:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({
    SecretId: secretName
  }).promise();

  return JSON.parse(data.SecretString);
}
```

**HashiCorp Vault:**
```bash
# Set up Vault
vault kv put secret/aeo \
  db_password="secure_pass" \
  jwt_secret="secure_jwt"

# Retrieve in app
vault kv get -field=db_password secret/aeo
```

**Vercel/Netlify:**
- Use dashboard Environment Variables section
- Set per environment (production, preview, development)
- Access via `process.env.VARIABLE_NAME`

### Database Security

#### 1. Connection Security

**Use SSL/TLS for database connections:**

```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString()
  }
});
```

#### 2. Password Hashing

**NEVER store plain text passwords:**

```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

#### 3. SQL Injection Prevention

**Always use parameterized queries:**

```javascript
// ❌ VULNERABLE - Never do this!
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ SAFE - Use parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [userInput]);
```

### API Security

#### 1. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### 2. CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 3. Helmet Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

### Authentication Security

#### JWT Best Practices

```javascript
const jwt = require('jsonwebtoken');

// Sign token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Security checklist:**
- ✅ Use strong secret (64+ random bytes)
- ✅ Set expiration time
- ✅ Validate token on every request
- ✅ Store tokens securely (httpOnly cookies)
- ✅ Implement token refresh mechanism
- ❌ Never store secrets in localStorage

### File Upload Security

```javascript
const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});
```

### Input Validation

```javascript
const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().max(100)
});

// Validate
const { error, value } = userSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

### HTTPS/SSL

#### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Strong SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Backup Security

#### Database Backups

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="aeo_website"

# Create backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Encrypt backup
gpg --encrypt --recipient your@email.com $BACKUP_DIR/backup_$DATE.sql.gz

# Delete unencrypted
rm $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Security Checklist

#### Before Deployment

- [ ] All .env files added to .gitignore
- [ ] No secrets in git history
- [ ] Strong passwords generated
- [ ] JWT secrets are random (64+ bytes)
- [ ] SSL certificate installed
- [ ] HTTPS redirect configured
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection enabled
- [ ] File upload restrictions in place
- [ ] Database backups configured
- [ ] Error messages don't leak info

#### Production Environment

- [ ] Environment variables set on server
- [ ] Database uses SSL connection
- [ ] Redis requires authentication
- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key authentication (no password login)
- [ ] Regular security updates scheduled
- [ ] Monitoring and alerting set up
- [ ] Log files secured and rotated
- [ ] Admin panel password protected
- [ ] 2FA enabled for critical accounts

### Incident Response

#### If Secrets Are Exposed

1. **Immediately:**
   - Rotate ALL compromised credentials
   - Change database passwords
   - Generate new JWT secrets
   - Revoke API keys
   - Invalidate all user sessions

2. **Assess Damage:**
   - Check logs for suspicious activity
   - Review database for unauthorized access
   - Check for data breaches

3. **Clean Up:**
   - Remove secrets from git history
   - Push new commit removing secrets
   - Force push to overwrite history (if private repo)
   - Notify team members

4. **Prevent Future:**
   - Add git hooks to prevent commits with secrets
   - Use secret scanning tools
   - Regular security audits

### Tools for Secret Detection

**git-secrets:**
```bash
# Install
brew install git-secrets  # macOS
git secrets --install

# Scan
git secrets --scan-history
```

**TruffleHog:**
```bash
# Install
pip install truffleHog

# Scan
trufflehog --regex --entropy=True .
```

**GitHub Secret Scanning:**
- Enable in repository settings
- Auto-detects common secret patterns
- Alerts on commits with secrets

### Regular Security Maintenance

**Weekly:**
- Review access logs
- Check for failed login attempts
- Monitor rate limit violations

**Monthly:**
- Update dependencies (`npm audit fix`)
- Review user permissions
- Backup verification
- SSL certificate check

**Quarterly:**
- Full security audit
- Penetration testing
- Dependency vulnerability scan
- Review and rotate credentials

### Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Let's Encrypt](https://letsencrypt.org/)

---

## Summary

**The Golden Rules:**
1. NEVER commit .env files
2. Use strong, random secrets
3. Rotate credentials regularly
4. Always use HTTPS in production
5. Validate all user input
6. Keep dependencies updated
7. Monitor and log everything
8. Have a backup strategy
9. Plan for incidents
10. Test your security regularly

Security is not optional—it's essential! 🔒
