# CabConnect Hosting Strategy

> **Quick Reference Guide for Backend Deployment Decisions**

---

## Stack Summary

- **Backend:** Node.js + Express + TypeScript + Socket.IO (WebSockets)
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (optional, graceful fallback)
- **Region:** Fiji / South Pacific
- **Critical Requirement:** WebSocket support (eliminates serverless options)

---

## Phase 1: Testing/Validation (FREE)

### Current Setup ✅

**Platform:** Render Free Tier + MongoDB Atlas M0

**Services:**
```
Backend:  Render Free Web Service (512 MB RAM, shared CPU)
Database: MongoDB Atlas M0 (512 MB, Singapore region)
Redis:    Skipped (app has graceful fallback)
Email:    Brevo Free (300 emails/day)

Total Cost: $0/month
```

**Render Configuration:**
```bash
Build Command:  npm install && npm run build
Start Command:  npm start
Health Check:   /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=<64_char_hex_string>
BREVO_API_KEY=<brevo_key>
BREVO_SENDER_EMAIL=noreply@fijicabconnect.com
ALLOWED_ORIGINS=<comma_separated_urls>
```

**Limitations:**
- ⚠️ Cold starts after 15 min inactivity (~30-60s wake time)
- ⚠️ 512 MB RAM limit
- ⚠️ No custom domain on free tier
- ⚠️ 200-300ms latency from Fiji

**Good For:** 0-50 test users, MVP validation

---

## Phase 2: Production (PAID)

### Recommended: Railway (~$20-25/month)

**When to Upgrade:**
- Cold starts affect user experience
- More than 10-20 rides per day
- Need guaranteed uptime & <2s response times
- Launching to real users

**Cost Breakdown:**
```
Node.js Service:  $5-10/month (always-on, 512 MB-1 GB RAM)
MongoDB Atlas:    $9/month (M10 cluster, Singapore)
Redis:            $5/month (Railway plugin)
Domain/SSL:       Included

Total:            ~$19-24/month
```

**Why Railway:**
- ✅ No cold starts (always-on)
- ✅ WebSocket support built-in
- ✅ One-click Redis deployment
- ✅ Deploy from GitHub (auto-deploy)
- ✅ Simple pricing (pay-as-you-go)
- ✅ Custom domains + SSL included
- ✅ Scales to 1K+ users easily

**Alternative: Render Paid ($23/month)**
- Same features as Railway
- $7/month per service (app + Redis)
- Zero migration friction from free tier
- Slightly more expensive

---

## Platform Comparison

| Platform | Monthly Cost | Cold Starts | Setup Time | Best For |
|----------|-------------|-------------|------------|----------|
| **Render Free** | $0 | ❌ Yes (15 min) | 5 min | Testing only |
| **Railway** | $20-25 | ✅ No | 10 min | Production <5K users |
| **Render Paid** | $23+ | ✅ No | 5 min | Production <5K users |
| **DigitalOcean** | $14+ | ✅ No | 20 min | Budget production |
| **AWS/GCP** | $50+ | ✅ No | 2+ hours | Enterprise scale |

---

## Migration: Render Free → Railway Paid

### Prerequisites
- [ ] Testing phase complete
- [ ] Ready for real users
- [ ] Budget approved (~$20/month)

### Steps (Zero Downtime)

**1. Setup Railway (15 min)**
```bash
1. Sign up at railway.app
2. Connect GitHub repository
3. Deploy → Select cabconnect-backend repo
4. Add environment variables (copy from Render)
5. Add Redis plugin (one click)
6. Get Railway URL: https://cabconnect-backend-production.up.railway.app
```

**2. Update MongoDB Access (2 min)**
```bash
# MongoDB Atlas already allows 0.0.0.0/0 - no changes needed
```

**3. Add Redis Support (5 min)**
```bash
# Railway auto-injects REDIS_URL environment variable
# App already supports Redis with graceful fallback
# No code changes needed
```

**4. Test Railway Deployment (10 min)**
```bash
# Test endpoints
curl https://cabconnect-backend-production.up.railway.app/health

# Test from mobile app (temporarily)
# Update API_URL in .env to Railway URL
# Test ride booking, OTP, real-time updates
```

**5. Cutover (5 min)**
```bash
1. Update passenger app EXPO_PUBLIC_API_URL to Railway URL
2. Update driver app API_URL to Railway URL
3. Deploy new app versions to Expo
4. Monitor Railway logs for 24 hours
5. Delete Render service after confirmed stable
```

**Total Migration Time:** ~45 minutes  
**Downtime:** 0 minutes (parallel deployment)

---

## Cost by User Scale

| Users | Platform | Monthly Cost | Notes |
|-------|----------|-------------|-------|
| 0-50 | Render Free | $0 | Testing only |
| 50-500 | Railway Starter | $20-25 | Early production |
| 500-2K | Railway Pro | $40-60 | Add monitoring |
| 2K-5K | Railway + Scaling | $80-120 | Consider migration |
| 5K+ | DigitalOcean K8s | $200-500 | Dedicated infra |

---

## Regional Latency (Fiji)

**Current Setup:**
- Backend: Singapore (~180-250ms)
- Database: Singapore (~180-250ms)
- Total API response: ~300-400ms

**Acceptable?**
- ✅ Yes for ride-hailing use case
- ✅ WebSocket maintains persistent connection
- ✅ Real-time updates within 500ms
- ⚠️ Consider AWS Sydney if latency becomes critical at scale

---

## Redis Strategy

### Testing Phase (Current)
- **No Redis** - In-memory fallback
- OTP storage: In-memory Map
- Rate limiting: In-memory store
- Works fine for <50 users

### Production Phase (Railway)
- **Add Redis** via Railway plugin
- Persistent OTP storage
- Distributed rate limiting
- Session management
- Idempotency key caching

### Redis Connection
```bash
# Railway auto-injects:
REDIS_URL=redis://default:password@redis.railway.internal:6379

# App automatically detects and uses Redis if REDIS_URL is set
# No code changes required
```

---

## Monitoring & Alerts

### Free Tier (Current)
- Render dashboard logs
- Basic health check monitoring
- Manual error checking

### Production (Railway)
- Railway built-in metrics
- Uptime monitoring (99.9% SLA)
- Email alerts on service down
- Consider adding: Sentry for error tracking

---

## Backup Strategy

### MongoDB Backups
- **Atlas M0 (Free):** No automated backups
- **Atlas M10 (Prod):** Daily automated backups
- Download manual backup before major changes

### Code Backups
- Git repository (already backed up)
- Railway auto-syncs with GitHub
- Keep production `.env` in password manager

---

## Security Checklist

### Before Production Deployment

- [ ] `JWT_SECRET` is 64+ character random hex
- [ ] `MONGODB_URI` uses Atlas (not localhost)
- [ ] `BREVO_API_KEY` is production key
- [ ] `OTP_MOCK_CODE` is NOT set in production env
- [ ] `ALLOWED_ORIGINS` includes production URLs only
- [ ] MongoDB Atlas Network Access: `0.0.0.0/0` (or restricted IPs)
- [ ] MongoDB user has read/write permissions only
- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] Brevo sender email is verified
- [ ] Test OTP emails arrive within 30s

---

## Quick Links

### Platform Dashboards
- **Render:** https://dashboard.render.com
- **Railway:** https://railway.app/dashboard
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Brevo:** https://app.brevo.com

### Docs
- Railway docs: https://docs.railway.app
- MongoDB Atlas docs: https://docs.atlas.mongodb.com
- Socket.IO deployment: https://socket.io/docs/v4/

---

## Decision Tree

```
Testing phase (0 users)?
└─ YES → Render Free + MongoDB Atlas M0
└─ NO  → Continue below

Cold starts acceptable?
└─ YES → Stay on Render Free
└─ NO  → Continue below

Budget approved (~$20/month)?
└─ NO  → Stay on Render Free until budget approved
└─ YES → Migrate to Railway Paid

More than 5K users?
└─ NO  → Stay on Railway
└─ YES → Evaluate DigitalOcean/AWS with DevOps support
```

---

## Contact & Support

- **Render Support:** https://render.com/docs
- **Railway Discord:** https://discord.gg/railway
- **MongoDB Support:** support@mongodb.com (paid tiers only)

---

**Last Updated:** 2026-02-12  
**Current Phase:** Testing (Render Free)  
**Next Milestone:** Migrate to Railway when ready for production
