// MUST be first import - loads .env before any other module reads process.env
import 'dotenv/config';

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth';
import { rideRouter } from './routes/ride';
import { historyRouter } from './routes/history';
import { driverRouter } from './routes/driver';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { initRealtime } from './realtime';
import { initRedis } from './services/redis';

// ============================================
// Production environment validation
// ============================================
if (process.env.NODE_ENV === 'production') {
  const warnings: string[] = [];

  if (process.env.OTP_MOCK_CODE) {
    warnings.push('❌ CRITICAL: OTP_MOCK_CODE is set in production! Remove it immediately.');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    warnings.push('❌ CRITICAL: JWT_SECRET is missing or too weak for production.');
  }

  // Enhanced email provider validation
  const hasBrevo = process.env.BREVO_API_KEY && 
                   process.env.BREVO_API_KEY !== 'your_brevo_api_key_here';
  const hasResend = process.env.RESEND_API_KEY && 
                    process.env.RESEND_API_KEY !== 'your_resend_api_key_here';
  
  if (!hasBrevo && !hasResend) {
    warnings.push('❌ CRITICAL: No email provider configured (Brevo or Resend). Email functionality will fail.');
  } else if (!hasResend) {
    warnings.push('⚠️  WARNING: No Resend backup configured. Email sending has no failover.');
  } else if (!hasBrevo) {
    console.log('ℹ️  INFO: Only Resend configured. Brevo not available.');
  } else {
    console.log('✅ Email providers configured: Brevo (primary), Resend (backup)');
  }

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1')) {
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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ridehailing';

// ============================================
// Security headers via Helmet
// ============================================
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
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// ============================================
// Response compression
// ============================================
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// ============================================
// CORS configuration with whitelist
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3001', 'http://localhost:8081', 'http://localhost:19006'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

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

app.use(express.json());

// ============================================
// Serve uploaded files
// ============================================
app.use('/uploads', express.static('uploads'));

// ============================================
// Routes
// ============================================
app.use('/auth', authRouter);
app.use('/ride', rideRouter);
app.use('/history', historyRouter);
app.use('/driver', driverRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

// ============================================
// Server startup
// ============================================
const httpServer = http.createServer(app);
initRealtime(httpServer);

// Initialize Redis (graceful degradation if unavailable)
initRedis();

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB connected');
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Accepting connections on all interfaces (use your machine IP for devices)`);
    console.log(`WebSocket (Socket.io) enabled for real-time updates`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
