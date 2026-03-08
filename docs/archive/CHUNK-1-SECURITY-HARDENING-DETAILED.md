# 🔒 CHUNK 1: SECURITY HARDENING - DETAILED IMPLEMENTATION GUIDE

**Duration**: 3 Days (24 hours total effort)  
**Priority**: 🔴 **CRITICAL - MUST BE COMPLETED BEFORE ANY OTHER WORK**  
**Risk Level**: High (will break existing sessions, requires careful execution)  
**Prerequisites**: Backup all databases, notify users of maintenance window

---

## EXECUTIVE SUMMARY

This chunk addresses **6 CRITICAL security vulnerabilities** that prevent production deployment:

1. Hardcoded API keys in repository (billing fraud risk)
2. Brevo API key exposed (email spam risk)
3. Default JWT secret (authentication bypass risk)
4. OTP stored in memory (scalability + persistence issue)
5. No HTTPS enforcement (man-in-the-middle risk)
6. OTP mock code in production (.env exposure risk)

**Expected Outcome**: All critical vulnerabilities patched, system production-ready from security perspective.

---

## DAY 1: SECRET ROTATION & GIT CLEANUP (8 hours)

### TASK 1.1: Inventory All Exposed Secrets (1 hour)

#### Step 1: Scan Repository for Secrets
```bash
# Check what's currently in .env files
cd cabconnect-passenger-app
cat .env

cd ../cabconnect-backend-main
cat .env

# Check git history for leaked secrets
git log --all --full-history -- "**/.env"
git log --all --full-history --grep="API_KEY"
```

#### Step 2: Document Current Keys
Create a spreadsheet/document with:

| Service | Key Type | Current Value (last 8 chars) | Location | Status |
|---------|----------|-------------------------------|----------|--------|
| Google Maps Places | API Key | ...nkJrGI | passenger-app/.env | 🔴 EXPOSED |
| Google Maps Directions | API Key | ...nkJrGI | passenger-app/.env | 🔴 EXPOSED |
| Geoapify | API Key | ...036fb4 | passenger-app/.env | 🔴 EXPOSED |
| Brevo | API Key | ...03bbd3 | backend/.env | 🔴 EXPOSED |
| JWT | Secret | default fallback | backend/middleware/auth.ts | 🔴 WEAK |

---

### TASK 1.2: Remove .env from Git History (2 hours)

**⚠️ WARNING**: This rewrites git history. Coordinate with team before executing.

#### Step 1: Backup Current State
```bash
# Create backup branch
cd cabconnect-passenger-app
git checkout -b backup-before-cleanup
git push origin backup-before-cleanup

cd ../cabconnect-backend-main
git checkout -b backup-before-cleanup
git push origin backup-before-cleanup
```

#### Step 2: Remove .env Files from History (Passenger App)
```bash
cd cabconnect-passenger-app

# Option A: Using git-filter-repo (RECOMMENDED - faster, safer)
pip install git-filter-repo
git filter-repo --path .env --invert-paths --force

# Option B: Using BFG Repo-Cleaner (if git-filter-repo not available)
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env

# Option C: Using filter-branch (slowest, but built-in)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

#### Step 3: Remove .env Files from History (Backend)
```bash
cd ../cabconnect-backend-main

# Use same method as above
git filter-repo --path .env --invert-paths --force
```

#### Step 4: Force Push (DANGEROUS - coordinate with team)
```bash
cd cabconnect-passenger-app
git push origin --force --all
git push origin --force --tags

cd ../cabconnect-backend-main
git push origin --force --all
git push origin --force --tags
```

#### Step 5: Update .gitignore
```bash
# Passenger App
cd cabconnect-passenger-app
echo "" >> .gitignore
echo "# Environment variables (DO NOT COMMIT)" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# Backend
cd ../cabconnect-backend-main
echo "" >> .gitignore
echo "# Environment variables (DO NOT COMMIT)" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.staging" >> .gitignore
```

#### Step 6: Commit .gitignore Changes
```bash
cd cabconnect-passenger-app
git add .gitignore
git commit -m "security: add .env to .gitignore to prevent secret leaks"
git push

cd ../cabconnect-backend-main
git add .gitignore
git commit -m "security: add .env to .gitignore to prevent secret leaks"
git push
```

---

### TASK 1.3: Rotate Google Maps API Keys (1 hour)

#### Step 1: Revoke Old Keys
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Find the exposed keys:
   - `AIzaSyA6HnCXen53WZoYO80YA-XzD4t23nkJrGI`
4. Click on each key → **Delete** or **Regenerate**
5. Confirm deletion

#### Step 2: Create New Restricted Keys

**Key 1: Places API (Android/iOS)**
```
Name: CabConnect-Places-Mobile-2026
API Restrictions:
  ✅ Places API
  ✅ Geocoding API
Application Restrictions:
  - Android: Add your package name (e.g., com.cabconnect.passenger)
  - iOS: Add your bundle ID (e.g., com.cabconnect.passenger)
```

**Key 2: Directions API (Android/iOS)**
```
Name: CabConnect-Directions-Mobile-2026
API Restrictions:
  ✅ Directions API
  ✅ Distance Matrix API
Application Restrictions:
  - Android: Add your package name
  - iOS: Add your bundle ID
```

**Key 3: Places API (Backend)**
```
Name: CabConnect-Backend-Maps-2026
API Restrictions:
  ✅ Places API
  ✅ Directions API
  ✅ Geocoding API
IP Restrictions:
  - Add your Render.com static IP (if available)
  - Or use Referrer restrictions with your backend domain
```

#### Step 3: Save New Keys Securely
**DO NOT** copy to any file yet. Save them in:
- Password manager (1Password, LastPass)
- Or Render.com environment variables (if deploying)
- Or local encrypted notes

---

### TASK 1.4: Rotate Geoapify API Key (30 minutes)

#### Step 1: Revoke Old Key
1. Go to: https://myprojects.geoapify.com/
2. Login to your account
3. Find project with key: `65bda2f3541e4b98b3b26df5bc036fb4`
4. Delete or regenerate key

#### Step 2: Create New Key
```
Name: CabConnect-StaticMaps-2026
Restrictions:
  - HTTP Referrer: Add your app domains
  - Rate Limit: Set appropriate limit (e.g., 10,000/day)
```

#### Step 3: Save New Key
Save securely (password manager or environment variables).

---

### TASK 1.5: Rotate Brevo API Key (30 minutes)

#### Step 1: Revoke Old Key
1. Go to: https://app.brevo.com/settings/keys/api
2. Find key ending in: `...03bbd3-0oyMGXsUWpcTX7LA`
3. Click **Delete**
4. Confirm deletion

#### Step 2: Create New Key
```
Name: CabConnect-Transactional-2026
Permissions:
  ✅ Send transactional emails
  ❌ Access contact database (not needed)
  ❌ Access campaigns (not needed)
```

#### Step 3: Save New Key
Save securely (password manager or environment variables).

---

### TASK 1.6: Generate Strong JWT Secret (15 minutes)

#### Step 1: Generate Cryptographically Secure Secret
```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output example: 5f8a2c3d7e9b1f4a6c8e2d5a7b9c3e1f4a6c8e2d5a7b9c3e1f4a6c8e2d5a7b9c3e1f4a6c8e2d5a7b9c3e1f4a6c8e

# Method 2: Using OpenSSL
openssl rand -hex 64
# Output example: 3a7f9c2e5d8b1a4f6c9e2d7a5b3c8e1f4a7c9e2d5b8a3f1c6e9d2a7b5c4e8f1a3c7e9b2d5f8a4c1e6d9b3a7c2f5e

# Method 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(64))"
```

**Save this JWT secret** - you'll need it for .env files.

---

### TASK 1.7: Create .env.example Templates (1 hour)

#### Step 1: Backend .env.example
```bash
cd cabconnect-backend-main
cat > .env.example << 'EOF'
# ============================================
# CABCONNECT BACKEND - ENVIRONMENT VARIABLES
# ============================================
# 
# INSTRUCTIONS:
# 1. Copy this file to .env: cp .env.example .env
# 2. Fill in all values marked as REQUIRED
# 3. NEVER commit .env to git (it's in .gitignore)
#
# ============================================

# --------------------------------------------
# DATABASE
# --------------------------------------------
# REQUIRED: MongoDB connection string
# Local dev: mongodb://127.0.0.1:27017/ridehailing
# Production: Get from MongoDB Atlas
MONGODB_URI=mongodb://127.0.0.1:27017/ridehailing

# --------------------------------------------
# SERVER
# --------------------------------------------
# REQUIRED: Port for Express server (default: 5000)
PORT=5000

# REQUIRED: Environment (development, staging, production)
NODE_ENV=development

# --------------------------------------------
# SECURITY
# --------------------------------------------
# REQUIRED: JWT secret for token signing (MUST be 32+ characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# ⚠️ CRITICAL: Change this in production! Default is INSECURE.
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_64_CHAR_HEX_STRING

# OPTIONAL: Allowed origins for CORS (comma-separated)
# Example: http://localhost:8081,https://cabconnect.app
ALLOWED_ORIGINS=http://localhost:8081

# --------------------------------------------
# EMAIL SERVICE (BREVO)
# --------------------------------------------
# REQUIRED: Brevo API key for sending emails
# Get from: https://app.brevo.com/settings/keys/api
# Should start with: xkeysib-...
BREVO_API_KEY=your_brevo_api_key_here

# REQUIRED: Verified sender email for Brevo
# Must be verified in your Brevo account
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# --------------------------------------------
# GOOGLE MAPS (OPTIONAL - for backend geocoding)
# --------------------------------------------
# OPTIONAL: Google Maps API key for backend services
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# --------------------------------------------
# OTP CONFIGURATION
# --------------------------------------------
# OPTIONAL: Mock OTP code for development/testing only
# ⚠️ WARNING: Remove or comment out in production!
# When set, all OTPs will be this value instead of random
OTP_MOCK_CODE=123456

# --------------------------------------------
# FARE CONFIGURATION (OPTIONAL)
# --------------------------------------------
# Base fare in local currency (default: 2.5)
FARE_BASE=2.5

# Cost per kilometer (default: 1.2)
FARE_PER_KM=1.2

# Cost per minute (default: 0.15)
FARE_PER_MIN=0.15

# Currency code (default: USD)
FARE_CURRENCY=USD

# --------------------------------------------
# REDIS (OPTIONAL - recommended for production)
# --------------------------------------------
# Redis connection URL for OTP storage
# Example: redis://localhost:6379
# Example: rediss://default:password@redis.upstash.io:6379
# REDIS_URL=redis://localhost:6379

# --------------------------------------------
# LOGGING (OPTIONAL)
# --------------------------------------------
# Log level: error, warn, info, debug
LOG_LEVEL=info

EOF
```

#### Step 2: Passenger App .env.example
```bash
cd ../cabconnect-passenger-app
cat > .env.example << 'EOF'
# ============================================
# CABCONNECT PASSENGER APP - ENVIRONMENT VARIABLES
# ============================================
# 
# INSTRUCTIONS:
# 1. Copy this file to .env: cp .env.example .env
# 2. Fill in all values marked as REQUIRED
# 3. NEVER commit .env to git (it's in .gitignore)
#
# ============================================

# --------------------------------------------
# GOOGLE MAPS API
# --------------------------------------------
# REQUIRED: Google Places API key for location search
# Get from: https://console.cloud.google.com/apis/credentials
# Restrict to: Places API, Geocoding API
# Restrict by: Android/iOS package name
EXPO_PUBLIC_PLACES_API_KEY=your_google_places_api_key_here

# REQUIRED: Google Directions API key for routing
# Get from: https://console.cloud.google.com/apis/credentials
# Restrict to: Directions API, Distance Matrix API
# Restrict by: Android/iOS package name
EXPO_PUBLIC_DIRECTIONS_API_KEY=your_google_directions_api_key_here

# --------------------------------------------
# GEOAPIFY API
# --------------------------------------------
# REQUIRED: Geoapify API key for static maps
# Get from: https://myprojects.geoapify.com/
# Used for displaying map thumbnails in ride cards
EXPO_PUBLIC_GEOAPIFY_API_KEY=your_geoapify_api_key_here

# --------------------------------------------
# BACKEND API URL
# --------------------------------------------
# REQUIRED: Backend API base URL
# Local dev: http://localhost:5000
# Production: https://your-backend.onrender.com (no trailing slash)
EXPO_PUBLIC_API_URL=http://localhost:5000

EOF
```

#### Step 3: Commit .env.example Files
```bash
cd cabconnect-backend-main
git add .env.example
git commit -m "security: add .env.example template with documentation"
git push

cd ../cabconnect-passenger-app
git add .env.example
git commit -m "security: add .env.example template with documentation"
git push
```

---

### TASK 1.8: Delete Old .env Files (15 minutes)

**⚠️ CRITICAL**: Before deleting, ensure you have all new keys saved securely.

```bash
# Backend
cd cabconnect-backend-main
rm .env  # Delete old file with exposed secrets

# Passenger App
cd ../cabconnect-passenger-app
rm .env  # Delete old file with exposed secrets
```

**Verify .env is gone**:
```bash
cd cabconnect-backend-main
ls -la | grep .env
# Should only show: .env.example

cd ../cabconnect-passenger-app
ls -la | grep .env
# Should only show: .env.example
```

---

## DAY 2: CODE HARDENING & SECRET MANAGEMENT (8 hours)

### TASK 2.1: Enforce JWT_SECRET Requirement (1 hour)

#### Step 1: Update Middleware
```bash
cd cabconnect-backend-main
```

**File**: `src/middleware/auth.ts`

**Current Code (Lines 5-6)**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'ridehailing-secret-change-in-production';
```

**Replace With**:
```typescript
// CRITICAL: Enforce JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '❌ FATAL: JWT_SECRET environment variable is not set!\n' +
    '   Generate a secure secret:\n' +
    '   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n' +
    '   Then add to .env: JWT_SECRET=<generated_value>'
  );
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    `❌ FATAL: JWT_SECRET is too weak (${JWT_SECRET.length} chars)!\n` +
    '   Must be at least 32 characters for security.\n' +
    '   Generate a secure secret:\n' +
    '   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n'
  );
}

// Log success (without revealing the secret)
console.log(`✅ JWT_SECRET loaded (${JWT_SECRET.length} chars)`);
```

#### Step 2: Test Locally
```bash
# Test without JWT_SECRET (should fail)
cd cabconnect-backend-main
PORT=5001 npm run dev
# Expected: Should throw error and exit

# Create new .env with JWT_SECRET
cp .env.example .env
# Edit .env and add your generated JWT_SECRET

# Test with JWT_SECRET (should succeed)
npm run dev
# Expected: "✅ JWT_SECRET loaded (128 chars)"
```

#### Step 3: Commit Changes
```bash
git add src/middleware/auth.ts
git commit -m "security: enforce JWT_SECRET requirement with validation"
git push
```

---

### TASK 2.2: Remove OTP_MOCK_CODE from Production (1 hour)

#### Step 1: Update OTP Service
```bash
cd cabconnect-backend-main
```

**File**: `src/services/emailOtp.ts`

**Current Code (Line 61)**:
```typescript
const code = process.env.OTP_MOCK_CODE || generateCode();
```

**Replace With**:
```typescript
// SECURITY: Only use mock OTP in development
const code = (process.env.NODE_ENV === 'development' && process.env.OTP_MOCK_CODE) 
  ? process.env.OTP_MOCK_CODE 
  : generateCode();

// Log warning if mock OTP is used
if (process.env.NODE_ENV === 'development' && process.env.OTP_MOCK_CODE) {
  console.log(`⚠️  DEV MODE: Using mock OTP code (${process.env.OTP_MOCK_CODE}) for ${email}`);
} else {
  // Log for debugging (in production, use structured logging instead)
  if (process.env.NODE_ENV !== 'production' || !process.env.BREVO_API_KEY) {
    console.log(`[EMAIL OTP] ${key} -> ${code} (purpose: ${purpose}, expires in ${OTP_TTL_MS / 60000} min)`);
  }
}
```

#### Step 2: Add Environment Check on Startup
**File**: `src/index.ts`

**Add After dotenv.config() (Line 11)**:
```typescript
dotenv.config();

// Validate production environment
if (process.env.NODE_ENV === 'production') {
  // Check for insecure configurations
  const warnings: string[] = [];
  
  if (process.env.OTP_MOCK_CODE) {
    warnings.push('❌ CRITICAL: OTP_MOCK_CODE is set in production! Remove it immediately.');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    warnings.push('❌ CRITICAL: JWT_SECRET is missing or too weak for production.');
  }
  
  if (!process.env.BREVO_API_KEY) {
    warnings.push('⚠️  WARNING: BREVO_API_KEY not set. Email functionality will fail.');
  }
  
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
    warnings.push('⚠️  WARNING: MONGODB_URI appears to be localhost. Use remote DB in production.');
  }
  
  if (warnings.length > 0) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 PRODUCTION CONFIGURATION ERRORS:');
    console.error('='.repeat(80));
    warnings.forEach(w => console.error(w));
    console.error('='.repeat(80) + '\n');
    
    // Exit if critical errors
    if (warnings.some(w => w.includes('CRITICAL'))) {
      console.error('❌ Cannot start server with critical configuration errors in production.');
      process.exit(1);
    }
  } else {
    console.log('✅ Production environment validation passed');
  }
}
```

#### Step 3: Test
```bash
# Test in development (with mock OTP)
NODE_ENV=development OTP_MOCK_CODE=123456 npm run dev
# Expected: "⚠️  DEV MODE: Using mock OTP code (123456)"

# Test in production (should reject mock OTP)
NODE_ENV=production OTP_MOCK_CODE=123456 npm run dev
# Expected: "❌ CRITICAL: OTP_MOCK_CODE is set in production!" + EXIT

# Test in production (without mock OTP)
NODE_ENV=production npm run dev
# Expected: Server starts normally
```

#### Step 4: Commit
```bash
git add src/services/emailOtp.ts src/index.ts
git commit -m "security: prevent OTP_MOCK_CODE usage in production"
git push
```

---

### TASK 2.3: Add Helmet.js for Security Headers (30 minutes)

#### Step 1: Install Helmet
```bash
cd cabconnect-backend-main
npm install helmet
npm install --save-dev @types/helmet
```

#### Step 2: Configure Helmet
**File**: `src/index.ts`

**Add Import (Line 6)**:
```typescript
import helmet from 'helmet';
```

**Add Middleware (After cors, Line 17)**:
```typescript
app.use(cors({ origin: true, credentials: true }));

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

app.use(express.json());
```

#### Step 3: Test Headers
```bash
npm run dev

# In another terminal, test headers:
curl -I http://localhost:5000/health

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### Step 4: Commit
```bash
git add package.json package-lock.json src/index.ts
git commit -m "security: add Helmet.js for security headers"
git push
```

---

### TASK 2.4: Restrict CORS to Specific Origins (1 hour)

#### Step 1: Update CORS Configuration
**File**: `src/index.ts`

**Current Code (Line 16)**:
```typescript
app.use(cors({ origin: true, credentials: true }));
```

**Replace With**:
```typescript
// CORS configuration with whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:8081', 'http://localhost:19006']; // Expo dev defaults

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin} not in whitelist`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));
```

#### Step 2: Update .env.example
**File**: `.env.example`

**Update CORS Section**:
```bash
# OPTIONAL: Allowed origins for CORS (comma-separated)
# Development: http://localhost:8081,http://localhost:19006
# Production: https://yourdomain.com,https://app.yourdomain.com
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

#### Step 3: Test CORS
```bash
# Start server
npm run dev

# Test allowed origin
curl -H "Origin: http://localhost:8081" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:5000/auth/login
# Expected: 200 OK with CORS headers

# Test blocked origin
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:5000/auth/login
# Expected: CORS error
```

#### Step 4: Commit
```bash
git add src/index.ts .env.example
git commit -m "security: restrict CORS to whitelisted origins"
git push
```

---

### TASK 2.5: Add Rate Limiting to /ride/estimate (1 hour)

#### Step 1: Create Rate Limiter
**File**: `src/routes/ride.ts`

**Add After Imports (Line 10)**:
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter for fare estimation
const estimateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { 
    message: 'Too many fare estimate requests. Please try again in a minute.' 
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on /ride/estimate`);
    res.status(429).json({
      message: 'Too many fare estimate requests. Please try again in a minute.',
      retryAfter: 60
    });
  }
});
```

#### Step 2: Apply to Endpoint
**File**: `src/routes/ride.ts`

**Current Code (Line 52)**:
```typescript
rideRouter.post('/estimate', async (req, res) => {
```

**Replace With**:
```typescript
rideRouter.post('/estimate', estimateLimiter, async (req, res) => {
```

#### Step 3: Test Rate Limit
```bash
npm run dev

# In another terminal, test rate limit:
for i in {1..12}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/ride/estimate \
    -H "Content-Type: application/json" \
    -d '{"pickup":{"lat":10,"lng":20},"dropoff":{"lat":11,"lng":21}}'
  echo ""
done

# Expected: First 10 succeed, next 2 return 429 Too Many Requests
```

#### Step 4: Commit
```bash
git add src/routes/ride.ts
git commit -m "security: add rate limiting to fare estimate endpoint"
git push
```

---

### TASK 2.6: Add Compression Middleware (30 minutes)

#### Step 1: Install Compression
```bash
npm install compression
npm install --save-dev @types/compression
```

#### Step 2: Add Middleware
**File**: `src/index.ts`

**Add Import**:
```typescript
import compression from 'compression';
```

**Add Middleware (After helmet)**:
```typescript
app.use(helmet({...}));

// Response compression
app.use(compression({
  level: 6, // Compression level (0-9, default 6)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress responses if client doesn't accept gzip
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(express.json());
```

#### Step 3: Test Compression
```bash
npm run dev

# Test with gzip:
curl -H "Accept-Encoding: gzip" http://localhost:5000/health -v

# Expected header: Content-Encoding: gzip
```

#### Step 4: Commit
```bash
git add package.json package-lock.json src/index.ts
git commit -m "perf: add response compression middleware"
git push
```

---

### TASK 2.7: Create Local Development .env Files (1 hour)

**⚠️ DO NOT COMMIT THESE FILES**

#### Step 1: Backend .env
```bash
cd cabconnect-backend-main
cp .env.example .env
```

**Edit `.env` with your secure values**:
```bash
# Use your generated JWT secret (128 chars)
JWT_SECRET=<paste your generated 128-char hex string>

# Use your new Brevo API key
BREVO_API_KEY=<paste your new Brevo key>
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# Keep mock OTP for development
OTP_MOCK_CODE=123456

# Local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/ridehailing

# Development mode
NODE_ENV=development
PORT=5000

# CORS for local Expo
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

#### Step 2: Passenger App .env
```bash
cd ../cabconnect-passenger-app
cp .env.example .env
```

**Edit `.env` with your new API keys**:
```bash
# Use your new Google Maps keys
EXPO_PUBLIC_PLACES_API_KEY=<paste your new Places key>
EXPO_PUBLIC_DIRECTIONS_API_KEY=<paste your new Directions key>

# Use your new Geoapify key
EXPO_PUBLIC_GEOAPIFY_API_KEY=<paste your new Geoapify key>

# Local backend
EXPO_PUBLIC_API_URL=http://localhost:5000
```

#### Step 3: Verify .env Not Tracked by Git
```bash
cd cabconnect-backend-main
git status
# .env should NOT appear in untracked files

cd ../cabconnect-passenger-app
git status
# .env should NOT appear in untracked files
```

---

### TASK 2.8: Configure Production Environment Variables (2 hours)

**For Render.com Deployment**

#### Step 1: Login to Render Dashboard
1. Go to: https://dashboard.render.com
2. Select your backend service
3. Navigate to: **Environment** tab

#### Step 2: Add Environment Variables
Click **Add Environment Variable** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Critical |
| `JWT_SECRET` | `<your-128-char-secret>` | Use password generator |
| `MONGODB_URI` | `<mongodb-atlas-connection-string>` | Get from MongoDB Atlas |
| `BREVO_API_KEY` | `<your-new-brevo-key>` | From Brevo dashboard |
| `BREVO_SENDER_EMAIL` | `noreply@yourdomain.com` | Must be verified in Brevo |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` | Your production domain |
| `PORT` | `5000` | (Optional, Render auto-assigns) |
| `FARE_BASE` | `2.5` | (Optional, adjust per region) |
| `FARE_PER_KM` | `1.2` | (Optional, adjust per region) |
| `FARE_PER_MIN` | `0.15` | (Optional, adjust per region) |
| `FARE_CURRENCY` | `USD` | (Optional, change if needed) |

**⚠️ IMPORTANT**: 
- Do NOT set `OTP_MOCK_CODE` in production
- Do NOT copy-paste from old .env files (they had exposed keys)

#### Step 3: Save and Deploy
1. Click **Save Changes**
2. Render will automatically redeploy with new environment variables
3. Monitor logs for: "✅ Production environment validation passed"

---

## DAY 3: TESTING & DOCUMENTATION (8 hours)

### TASK 3.1: Comprehensive Security Testing (3 hours)

#### Test 1: JWT Secret Enforcement
```bash
# Test 1a: Server should NOT start without JWT_SECRET
cd cabconnect-backend-main
JWT_SECRET= npm run dev
# Expected: Error + Exit

# Test 1b: Server should NOT start with weak JWT_SECRET
JWT_SECRET=short npm run dev
# Expected: Error about length + Exit

# Test 1c: Server should start with valid JWT_SECRET
npm run dev
# Expected: "✅ JWT_SECRET loaded (128 chars)"
```

#### Test 2: OTP Mock Code Protection
```bash
# Test 2a: Mock OTP should work in development
NODE_ENV=development OTP_MOCK_CODE=123456 npm run dev
# Make signup request, verify OTP=123456 works

# Test 2b: Mock OTP should NOT work in production
NODE_ENV=production OTP_MOCK_CODE=123456 npm run dev
# Expected: Server refuses to start

# Test 2c: Production should generate random OTPs
NODE_ENV=production npm run dev
# Make signup request, check logs for random 6-digit code
```

#### Test 3: CORS Restrictions
```bash
npm run dev

# Test 3a: Allowed origin should succeed
curl -H "Origin: http://localhost:8081" \
     -X POST http://localhost:5000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
# Expected: 200 or 401 (not CORS error)

# Test 3b: Blocked origin should fail
curl -H "Origin: https://evil.com" \
     -X POST http://localhost:5000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
# Expected: CORS error
```

#### Test 4: Rate Limiting
```bash
# Test 4a: Fare estimate rate limit
for i in {1..15}; do
  curl -X POST http://localhost:5000/ride/estimate \
    -H "Content-Type: application/json" \
    -d '{"pickup":{"lat":10,"lng":20},"dropoff":{"lat":11,"lng":21}}'
done
# Expected: First 10 succeed, rest fail with 429

# Test 4b: Auth rate limit
for i in {1..60}; do
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'
done
# Expected: First 50 succeed, rest fail with 429
```

#### Test 5: Security Headers (Helmet)
```bash
curl -I http://localhost:5000/health

# Verify these headers exist:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### Test 6: Compression
```bash
curl -H "Accept-Encoding: gzip" http://localhost:5000/health -v | grep "Content-Encoding"
# Expected: Content-Encoding: gzip
```

---

### TASK 3.2: Update Documentation (2 hours)

#### Document 1: Backend README
```bash
cd cabconnect-backend-main
```

**Create/Update**: `README.md`

```markdown
# CabConnect Backend

Node.js/Express backend for CabConnect ride-hailing platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 7+
- npm or yarn

### Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repo-url>
   cd cabconnect-backend-main
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment variables**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   **CRITICAL**: Edit `.env` and set all required variables:
   - `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `MONGODB_URI` (local: `mongodb://127.0.0.1:27017/ridehailing`)
   - `BREVO_API_KEY` (get from https://app.brevo.com/settings/keys/api)
   - `BREVO_SENDER_EMAIL` (verified email in Brevo account)

4. **Start MongoDB**
   \`\`\`bash
   mongod --dbpath /data/db
   \`\`\`

5. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

Server will start at: http://localhost:5000

## 🔒 Security

**⚠️ NEVER commit `.env` files to git!**

### Production Checklist
- [ ] JWT_SECRET is 32+ characters (random, not default)
- [ ] OTP_MOCK_CODE is NOT set (or commented out)
- [ ] MongoDB URI points to remote database (not localhost)
- [ ] ALLOWED_ORIGINS includes only production domains
- [ ] BREVO_API_KEY is rotated from example
- [ ] All secrets stored in environment variables (not code)

### Key Rotation
If secrets are compromised:
1. Rotate immediately in service dashboards (Brevo, Google, etc.)
2. Update environment variables in Render.com
3. Force redeploy backend
4. Notify users to re-login (JWT tokens invalidated)

## 📖 API Documentation

See: [API_DOCS.md](./API_DOCS.md)

## 🐛 Troubleshooting

**Error: JWT_SECRET must be set**
- Cause: Missing or too short JWT_SECRET in .env
- Fix: Generate secure secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

**Error: OTP_MOCK_CODE is set in production**
- Cause: Development config leaked to production
- Fix: Remove OTP_MOCK_CODE from production .env

**MongoDB connection failed**
- Check MongoDB is running: `mongod --version`
- Verify MONGODB_URI in .env is correct

## 📝 License

[Your License]
```

#### Document 2: Security Policy
```bash
cd cabconnect-backend-main
```

**Create**: `SECURITY.md`

```markdown
# Security Policy

## Reporting a Vulnerability

**DO NOT open public issues for security vulnerabilities.**

Email: security@yourdomain.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

Response time: 48 hours

## Security Best Practices

### For Developers
1. Never commit secrets (.env, API keys, tokens)
2. Always use environment variables for config
3. Rotate secrets if accidentally exposed
4. Review code for security issues before merge
5. Keep dependencies updated

### For Deployers
1. Use strong, unique secrets for production
2. Enable HTTPS/TLS for all traffic
3. Restrict CORS to known origins
4. Monitor logs for suspicious activity
5. Regular security audits

## Security Features

- ✅ JWT authentication with secure signing
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting on all sensitive endpoints
- ✅ Helmet.js security headers
- ✅ Input validation and sanitization
- ✅ CORS origin whitelist
- ✅ OTP expiry (10 minutes)
- ✅ Role-based access control

## Vulnerability Disclosure

When vulnerabilities are patched:
1. Security advisory published on GitHub
2. Users notified via email
3. Patch release with CVE reference
4. 30-day grace period before full disclosure
```

#### Commit Documentation
```bash
git add README.md SECURITY.md
git commit -m "docs: add security documentation and setup guide"
git push
```

---

### TASK 3.3: Team Communication & Handoff (1 hour)

#### Document 3: Migration Guide for Team
```bash
cd cabconnect-docs
```

**Create**: `SECURITY-MIGRATION-GUIDE.md`

```markdown
# Security Migration Guide

**Date**: [Today's Date]  
**Completed By**: [Your Name]  
**Status**: ✅ Security hardening complete

## What Changed

All exposed API keys and secrets have been rotated:
- ✅ Google Maps API keys (Places, Directions)
- ✅ Geoapify API key
- ✅ Brevo email API key
- ✅ JWT secret (now enforced, no default)

## Action Required

### For All Developers

1. **Pull latest code**
   \`\`\`bash
   git pull origin main
   \`\`\`

2. **Delete old .env files**
   \`\`\`bash
   cd cabconnect-backend-main
   rm .env
   
   cd ../cabconnect-passenger-app
   rm .env
   \`\`\`

3. **Create new .env from template**
   \`\`\`bash
   cd cabconnect-backend-main
   cp .env.example .env
   # Edit .env with new secrets (see password manager)
   
   cd ../cabconnect-passenger-app
   cp .env.example .env
   # Edit .env with new API keys (see password manager)
   \`\`\`

4. **Get new secrets from**
   - Password manager: [Link to 1Password/LastPass vault]
   - Or contact: [Admin Email]

5. **Test locally**
   \`\`\`bash
   # Backend
   cd cabconnect-backend-main
   npm run dev
   # Should see: "✅ JWT_SECRET loaded (128 chars)"
   
   # Frontend
   cd cabconnect-passenger-app
   npm start
   \`\`\`

### For DevOps/Deployment

1. **Update production environment variables** in Render.com (see CHUNK-1 guide)
2. **Verify production validation** passes on deploy
3. **Monitor logs** for first 24 hours post-deployment

## Breaking Changes

⚠️ **All existing user sessions will be invalidated** (JWT secret changed)
- Users must log in again
- Consider sending email notification

⚠️ **OTP_MOCK_CODE no longer works in production**
- Development/testing only
- Production uses random OTPs

## Rollback Plan

If critical issues arise:
1. Restore backup branch: `git checkout backup-before-cleanup`
2. Revert to old secrets temporarily
3. Debug issue in staging environment
4. Re-apply security fixes once resolved

## Questions?

Contact: [Your Email/Slack]
```

#### Send Email/Slack Notification
```
Subject: 🔒 [URGENT] Security Migration Complete - Action Required

Team,

Security hardening is complete. All API keys and secrets have been rotated for security.

ACTION REQUIRED:
1. Pull latest code: git pull origin main
2. Delete your local .env files
3. Create new .env from .env.example templates
4. Get new secrets from [password manager link]
5. Test locally before deploying

⚠️ Breaking Change: All users will need to re-login (JWT secret changed)

Full guide: /cabconnect-docs/SECURITY-MIGRATION-GUIDE.md

Questions? Reply to this thread.

- [Your Name]
```

---

### TASK 3.4: Final Validation & Sign-off (2 hours)

#### Validation Checklist

**Backend**:
- [ ] .env is in .gitignore
- [ ] .env.example exists with all required fields documented
- [ ] JWT_SECRET enforcement works (server exits without it)
- [ ] OTP_MOCK_CODE blocked in production
- [ ] Helmet headers present in responses
- [ ] CORS restricted to whitelist
- [ ] Rate limiting works on /ride/estimate
- [ ] Compression enabled (Content-Encoding: gzip)
- [ ] Production validation runs on startup
- [ ] No secrets hardcoded in source code

**Passenger App**:
- [ ] .env is in .gitignore
- [ ] .env.example exists with all required fields
- [ ] Old API keys removed from git history
- [ ] No secrets in source code

**Documentation**:
- [ ] README.md updated with security section
- [ ] SECURITY.md created with reporting process
- [ ] SECURITY-MIGRATION-GUIDE.md created for team

**Team Communication**:
- [ ] Email/Slack sent to team
- [ ] New secrets shared via password manager
- [ ] Migration guide accessible to all

#### Production Deployment Test

1. **Deploy to staging first**
   ```bash
   # Push to staging branch
   git checkout staging
   git merge main
   git push origin staging
   ```

2. **Verify staging**
   - Check logs for: "✅ Production environment validation passed"
   - Test signup with random OTP (not 123456)
   - Test JWT authentication
   - Check security headers
   - Test rate limits

3. **Deploy to production**
   ```bash
   git checkout main
   git push origin main
   ```

4. **Monitor production for 2 hours**
   - Watch error logs
   - Monitor failed login attempts
   - Check for CORS errors
   - Verify OTP emails sending

#### Sign-off Document

**CHUNK 1 - SECURITY HARDENING**

**Completed**: [Date]  
**Duration**: [Actual hours]  
**Status**: ✅ COMPLETE

**Vulnerabilities Fixed**:
- ✅ Exposed API keys rotated and removed from git
- ✅ JWT secret enforced (no default allowed)
- ✅ OTP mock code restricted to development only
- ✅ HTTPS enforcement (via Render.com)
- ✅ CORS restricted to whitelist
- ✅ Rate limiting added to fare estimates

**Deliverables**:
- ✅ .gitignore updated (both repos)
- ✅ .env.example templates created
- ✅ Security middleware implemented (Helmet, CORS, rate limiting)
- ✅ Environment validation on startup
- ✅ Documentation (README, SECURITY.md, migration guide)
- ✅ Team notified and new secrets distributed

**Production Ready**: ✅ YES

**Approved By**: _________________  
**Date**: _________________

---

## Next Steps

Proceed to **CHUNK 2: AUTH COMPLETION** (Token refresh, Redis OTP storage, idempotency keys)

---

## Emergency Contacts

**Security Issues**: security@yourdomain.com  
**DevOps Lead**: [Name/Email]  
**Project Manager**: [Name/Email]

---

**End of CHUNK 1 Detailed Guide**
