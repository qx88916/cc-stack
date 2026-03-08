# 🚀 PRODUCTION DEPLOYMENT GUIDE - Render + MongoDB Atlas

**Target**: Fiji Market  
**Services**: Backend (Render Web Service) + MongoDB Atlas (Free/Shared)  
**Estimated Time**: 1-2 hours

---

## PART 1: MONGODB ATLAS SETUP (20 minutes)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Verify email

### Step 2: Create Free Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Provider: **AWS**
4. Region: **Sydney (ap-southeast-2)** (closest to Fiji)
5. Cluster Name: `cabconnect-fiji`
6. Click "Create"

**Wait 3-5 minutes for cluster creation**

### Step 3: Create Database User
1. Security → Database Access → "Add New Database User"
2. Authentication Method: **Password**
3. Username: `cabconnect-admin`
4. Password: **Auto-generate** (copy this!)
5. Database User Privileges: **Read and write to any database**
6. Click "Add User"

### Step 4: Whitelist IP Addresses
1. Security → Network Access → "Add IP Address"
2. Click "Allow Access from Anywhere" → `0.0.0.0/0`
3. Confirm (required for Render's dynamic IPs)

### Step 5: Get Connection String
1. Database → Connect → "Drivers"
2. Select: **Node.js** driver
3. Copy connection string:
```
mongodb+srv://cabconnect-admin:<password>@cabconnect-fiji.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
4. Replace `<password>` with the password you copied earlier
5. Add database name: `...mongodb.net/cabconnect?retryWrites=true...`

**Final format:**
```
mongodb+srv://cabconnect-admin:YOUR_PASSWORD@cabconnect-fiji.xxxxx.mongodb.net/cabconnect?retryWrites=true&w=majority
```

**Save this connection string!** You'll need it for Render.

---

## PART 2: RENDER BACKEND DEPLOYMENT (30 minutes)

### Step 1: Connect GitHub to Render
1. Go to https://dashboard.render.com
2. Sign up/login
3. New → Web Service
4. Connect your GitHub account
5. Select repository: `cabconnect-backend`

### Step 2: Configure Web Service

**Basic Settings:**
- Name: `cabconnect-backend-fiji`
- Region: **Singapore** (closest to Fiji)
- Branch: `main`
- Root Directory: `.` (leave empty)
- Runtime: **Node**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Instance Type:**
- Free tier (sufficient for pilot)
- Can upgrade to Starter ($7/month) if needed

### Step 3: Add Environment Variables

Click "Advanced" → "Add Environment Variable"

**Add these one by one:**

```bash
# Database
MONGODB_URI=mongodb+srv://cabconnect-admin:YOUR_PASSWORD@cabconnect-fiji.xxxxx.mongodb.net/cabconnect?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=production

# Security (CRITICAL - Generate new for production!)
JWT_SECRET=<run this locally: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# CORS (Update with your Render URL after deployment)
ALLOWED_ORIGINS=https://cabconnect-backend-fiji.onrender.com

# Email Service
BREVO_API_KEY=<your_new_brevo_key_here>
BREVO_SENDER_EMAIL=noreply@fijicabconnect.com

# Google Maps
GOOGLE_MAPS_API_KEY=<your_google_maps_key>

# Geoapify
GEOAPIFY_API_KEY=<your_geoapify_key>

# Fare Configuration (Fiji)
FARE_BASE=3.00
FARE_PER_KM=1.50
FARE_PER_MIN=0.20
FARE_CURRENCY=FJD

# Redis (Optional - use Render Redis or Upstash)
# REDIS_URL=redis://...
# Leave empty for now, app will gracefully degrade

# OTP (DO NOT SET IN PRODUCTION!)
# OTP_MOCK_CODE=  <-- MUST BE EMPTY OR NOT SET
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for initial deployment
3. Watch logs for errors

**Expected Logs:**
```
Installing dependencies...
Running build...
✅ JWT_SECRET loaded (128 chars)
✅ MongoDB connected
✅ Production environment validation passed
🚀 Server running on port 5000
```

**If deployment fails:**
- Check "Logs" tab for errors
- Common issues:
  - Missing env vars
  - MongoDB connection string incorrect
  - Build errors (run `npm run build` locally first)

### Step 5: Get Your Backend URL
Once deployed, Render provides:
```
https://cabconnect-backend-fiji.onrender.com
```

**Copy this URL!** You'll need it for the passenger app.

### Step 6: Update ALLOWED_ORIGINS
1. Render Dashboard → Environment
2. Edit `ALLOWED_ORIGINS`:
```
https://cabconnect-backend-fiji.onrender.com,http://localhost:8081,http://localhost:19006
```
3. Save → Trigger redeploy

---

## PART 3: PASSENGER APP CONFIGURATION (10 minutes)

### Step 1: Update .env
```bash
cd d:\Projects\08_CC\cabconnect-apps\cabconnect-passenger-app
```

Edit `.env`:
```bash
EXPO_PUBLIC_API_URL=https://cabconnect-backend-fiji.onrender.com

# Google Maps (same as backend)
EXPO_PUBLIC_PLACES_API_KEY=<your_google_maps_key>
EXPO_PUBLIC_DIRECTIONS_API_KEY=<your_google_maps_key>

# Geoapify
EXPO_PUBLIC_GEOAPIFY_API_KEY=<your_geoapify_key>
```

### Step 2: Restart Expo
```bash
npm start -- --reset-cache
```

### Step 3: Test Production Backend
1. Open app
2. Sign up or login
3. Book a ride

**Expected:**
- ✅ All API calls go to Render backend
- ✅ Ride booking works
- ✅ Socket.io connects to production

---

## PART 4: OPTIONAL - RENDER REDIS (10 minutes)

**If you want Redis in production:**

### Step 1: Create Redis Instance
1. Render Dashboard → New → Redis
2. Name: `cabconnect-redis`
3. Plan: **Free** (25 MB, sufficient for pilot)
4. Region: **Singapore**
5. Click "Create Redis"

### Step 2: Get Redis URL
1. Once created, copy **Internal Redis URL**:
```
redis://red-xxxxx:6379
```

### Step 3: Add to Backend Env Vars
1. Backend service → Environment
2. Add: `REDIS_URL=redis://red-xxxxx:6379`
3. Save → Redeploy

**Expected:**
```
✅ Redis connected: red-xxxxx:6379
✅ OTP will be stored in Redis
✅ Maps API responses will be cached
✅ Idempotency keys will persist
```

---

## PART 5: POST-DEPLOYMENT VERIFICATION (15 minutes)

### 1. Health Check
**Visit in browser:**
```
https://cabconnect-backend-fiji.onrender.com/
```

**Expected:**
```json
{ "message": "Ride hailing API is running 🚗" }
```

### 2. Test Signup
1. Open passenger app (pointing to production)
2. Sign up new account
3. Check email for OTP

**Expected:**
- ✅ OTP email arrives (via Brevo)
- ✅ Verification works
- ✅ Account created in MongoDB Atlas

### 3. Test Ride Booking
1. Set pickup (Suva)
2. Set dropoff (within Fiji)
3. Get estimate
4. Book ride

**Expected:**
- ✅ Estimate works (check Render logs)
- ✅ Ride created in MongoDB Atlas
- ✅ Driver matching works
- ✅ Socket.io connects

### 4. Check Render Logs
Dashboard → Logs tab

**Watch for:**
```
✅ JWT_SECRET loaded
✅ MongoDB connected
✅ Production environment validation passed
[Matching] Assigned driver...
[Maps] Cache hit/miss
```

### 5. Monitor Metrics
Dashboard → Metrics tab

**Check:**
- CPU usage < 50%
- Memory usage < 500 MB
- Response times < 200ms

---

## 🔒 SECURITY CHECKLIST (CRITICAL)

Before going live, verify:

- [ ] `JWT_SECRET` is NEW (128 chars, never committed to git)
- [ ] `BREVO_API_KEY` is rotated (not the exposed one)
- [ ] `GOOGLE_MAPS_API_KEY` is restricted (API restrictions + HTTP referrer)
- [ ] `OTP_MOCK_CODE` is NOT set in production env vars
- [ ] `NODE_ENV=production` is set
- [ ] `MONGODB_URI` points to Atlas (not localhost)
- [ ] `ALLOWED_ORIGINS` includes only your domains
- [ ] `.env` file is NOT committed to git
- [ ] Git history is clean (no exposed secrets)

---

## 💰 COST ESTIMATE

| Service | Plan | Cost/Month |
|---------|------|-----------|
| Render Web Service | Free | $0 |
| Render Redis (optional) | Free | $0 |
| MongoDB Atlas | M0 Free | $0 |
| Google Maps API | Pay-as-you-go | ~$5-10 |
| Brevo Email | Free (300/day) | $0 |
| **Total** | | **$5-10/month** |

**If upgraded:**
- Render Starter: $7/month (recommended after pilot)
- MongoDB Shared: $9/month (if Free tier insufficient)
- **Total with upgrades**: $21-26/month

---

## 🐛 TROUBLESHOOTING

### Issue: "Application Error" on Render
**Check Logs:**
- JWT_SECRET missing → Add env var
- MongoDB connection failed → Check connection string
- Build failed → Run `npm run build` locally first

### Issue: OTP emails not sending
**Verify:**
- BREVO_API_KEY is correct
- Sender email verified in Brevo
- Check Brevo dashboard for send logs

### Issue: Socket.io won't connect from app
**Check:**
- ALLOWED_ORIGINS includes Render URL
- Helmet CORS settings allow WebSocket
- JWT token is valid

### Issue: Driver matching not working
**Verify:**
- At least one driver exists in DB
- Driver `isOnline: true`
- Driver has valid `lastLocation` coordinates
- Coordinates are within Fiji geofence

---

## 📱 TESTING IN PRODUCTION

### Test with Real Devices
1. Install Expo Go on Android/iOS
2. Build production APK/IPA (optional)
3. Test from Suva, Fiji location (if possible)

### Test Scenarios:
1. Sign up new passenger
2. Book ride in Suva
3. Verify driver assignment
4. Complete ride
5. Submit rating
6. Check ride history

---

## 🎉 DEPLOYMENT SUCCESS CRITERIA

✅ Backend health check returns 200  
✅ Passenger can sign up and verify OTP  
✅ Ride booking works end-to-end  
✅ Driver auto-assignment works  
✅ Socket.io real-time updates work  
✅ No critical errors in Render logs  
✅ MongoDB Atlas shows ride data  
✅ Response times < 500ms  

**If all criteria met: PRODUCTION READY! 🚀**

---

## 📞 SUPPORT

**Render Issues**: https://render.com/docs  
**MongoDB Issues**: https://www.mongodb.com/docs/atlas/  
**Google Maps Issues**: https://console.cloud.google.com/support  

---

**Next Steps After Deployment:**
1. Monitor Render logs for 24 hours
2. Test with real drivers in Fiji
3. Collect feedback
4. Proceed to Driver App development
