# 🚀 CabConnect E2E Testing - Quick Start Guide

## Current Status: READY TO TEST ✅

All systems are running and configured. App is ready for comprehensive testing on Android device.

---

## 📋 System Status

### Backend Server ✅
- **URL:** `http://192.168.0.133:5000`
- **Status:** Running
- **Port:** 5000
- **MongoDB:** Connected
- **WebSocket:** Enabled
- **Health:** `http://192.168.0.133:5000/health` → `{"ok":true}`

### Expo Dev Server ✅
- **Status:** Running
- **Metro Bundler:** Started
- **QR Code:** Available in terminal
- **Environment:** Development

### Test Data ✅
- **Test Drivers:** 4 created (3 online, 1 offline)
- **Service Areas:** Suva, Nadi, Lautoka
- **Mock OTP:** `123456` (enabled in backend)

---

## 🔧 Critical Bugs Fixed

### 1. ✅ Missing Email Suggestion Function
- **File:** `utils/emailHelper.ts`
- **Issue:** App crashed on signup screen
- **Fix:** Implemented `suggestEmailDomain()` function

### 2. ✅ WebSocket Token Key Mismatch
- **File:** `contexts/SocketContext.tsx`
- **Issue:** WebSocket couldn't authenticate (wrong storage key)
- **Fix:** Changed from `'token'` to `'@auth/token'`

### 3. ✅ Backend URL Configuration
- **File:** `cabconnect-passenger-app/.env`
- **Issue:** Using localhost (won't work on Android)
- **Fix:** Updated to local IP `192.168.0.133:5000`

### 4. ✅ No Test Drivers
- **File:** `setup-test-drivers.js`
- **Issue:** Database empty, no drivers for testing
- **Fix:** Created 4 test drivers with realistic data

---

## 📱 Testing on Android Device

### Step 1: Connect Device
1. Ensure Android device on same WiFi network (192.168.0.x)
2. Install **Expo Go** from Google Play Store
3. Open Expo Go app

### Step 2: Load App
1. Open terminal where Expo is running
2. Scan QR code with Expo Go
3. App will load (may take 30-60 seconds first time)
4. Grant permissions when prompted:
   - Location (for ride booking)
   - Camera (for profile photo)
   - Gallery (for profile photo)

### Step 3: Start Testing
1. Open: `E2E-TESTING-EXECUTION-CHECKLIST.md`
2. Start with **Test Suite 1: Authentication**
3. Follow step-by-step instructions
4. Check off each test as completed
5. Document any bugs found

---

## 🧪 Test Credentials & Data

### Mock OTP Code
```
123456
```
Use this for all OTP verifications (signup, email verify, password reset)

### Test Email Typos (to test suggestion feature)
```
user@gmial.com   → suggests: user@gmail.com
user@yaho.com    → suggests: user@yahoo.com
user@hotmial.com → suggests: user@hotmail.com
```

### Test Locations (Within Geofence)

**Suva:**
- Victoria Parade, Suva
- Ratu Sukuna Park, Suva
- Government Buildings, Suva

**Nadi:**
- Nadi International Airport
- Nadi Town
- Denarau Island

**Lautoka:**
- Lautoka City
- Lautoka Hospital
- Lautoka Market

### Test Drivers (Auto-assigned)
1. **John Tuivaga** - Suva, Toyota Corolla FJ-1234, 4.8★
2. **Maria Singh** - Nadi, Honda Civic FJ-5678, 4.9★
3. **Seru Bale** - Lautoka, Nissan Tiida FJ-9012, 5.0★
4. **Ana Kolinisau** - Suva (offline), Mazda Demio FJ-3456, 4.7★

---

## 📖 Testing Flow Overview

### Complete User Journey
```
1. SIGNUP
   Welcome → Signup → OTP Verification → Home

2. BOOK RIDE
   Home → Find Ride → Confirm Ride → Book Ride → 
   Driver Assignment → Trip Complete → Rating

3. PROFILE
   Profile → Edit Profile → Upload Photo → 
   Saved Places → Email Verification

4. HISTORY
   Rides Tab → Past/Upcoming → View Details → Rebook
```

---

## 🐛 If You Find Bugs

### Document Using This Format:

**Bug Title:** [Short description]

**Severity:** Critical | High | Medium | Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]

**Actual:** [What actually happened]

**Screenshots/Logs:** [Paste error logs]

---

## 🔍 Quick Debugging

### App Not Loading?
```bash
# Check if device can reach backend
# On Android, use Network Tools app or browser:
http://192.168.0.133:5000/health

# If fails, check WiFi connection
# If still fails, get new IP:
ipconfig | findstr IPv4
# Update passenger-app/.env with new IP
```

### WebSocket Not Connecting?
```bash
# Check backend logs for:
"WebSocket connected: [user id]"

# If not appearing, verify:
1. User is logged in (token exists)
2. Token key matches in SocketContext (@auth/token)
3. Backend WebSocket enabled in logs
```

### No Drivers Available?
```javascript
// Check MongoDB:
db.drivers.find({ isOnline: true })

// If none, run setup script:
node setup-test-drivers.js
```

### API Errors?
```bash
# Backend logs show all API calls
# Look for 4xx or 5xx responses
# Common issues:
- 401: Auth token expired or invalid
- 400: Validation error (check request body)
- 500: Server error (check backend logs)
```

---

## 📊 Testing Progress Tracking

### Quick Checklist

**Authentication (4 tests):**
- [ ] Signup with OTP
- [ ] Login
- [ ] Forgot Password
- [ ] Email Verification

**Ride Booking (4 tests):**
- [ ] Find Ride
- [ ] Confirm Ride (Fare Estimate)
- [ ] Book Ride & Driver Assignment
- [ ] Trip Complete & Rating

**Profile (3 tests):**
- [ ] View Profile
- [ ] Edit Profile
- [ ] Upload Profile Photo

**Saved Places (4 tests):**
- [ ] View Saved Places
- [ ] Add Home
- [ ] Add Work
- [ ] Quick Book from Home

**Ride History (4 tests):**
- [ ] View Past Rides
- [ ] View Upcoming Rides
- [ ] Rebook Ride
- [ ] View Ride Details

**Real-Time (3 tests):**
- [ ] WebSocket Connection
- [ ] Driver Assignment Events
- [ ] Ride Status Updates

**Edge Cases (7 tests):**
- [ ] Geofence - Pickup Outside
- [ ] Geofence - Destination Outside
- [ ] No Drivers Available
- [ ] Network Errors
- [ ] Duplicate Booking Prevention
- [ ] Session Expiry
- [ ] Account Deletion

**UI/UX (4 tests):**
- [ ] Dark Mode
- [ ] Animations
- [ ] Haptic Feedback
- [ ] Performance

**Total:** ~38 major test scenarios

---

## 🛠️ Useful Commands

### Backend
```bash
# View logs
# Already running in terminal

# Restart backend
# Ctrl+C in backend terminal, then:
npm run dev

# Check health
curl http://localhost:5000/health
```

### MongoDB
```javascript
// View all drivers
db.drivers.find().pretty()

// Set all drivers online
db.drivers.updateMany({}, { $set: { isOnline: true } })

// Set all offline (for testing)
db.drivers.updateMany({}, { $set: { isOnline: false } })

// View all rides
db.rides.find().sort({ createdAt: -1 }).pretty()

// Update ride status (for testing)
db.rides.updateOne(
  { _id: ObjectId('RIDE_ID') },
  { $set: { status: 'completed' } }
)

// Clear test data
db.users.deleteMany({ email: { $regex: '@test' } })
db.rides.deleteMany({})
```

### Expo
```bash
# Clear cache and restart
npx expo start -c

# View logs
# Watch terminal for errors

# Reload app on device
# Shake device → Reload
```

---

## 📞 Support Files

### Main Testing Documents
1. **E2E-TESTING-EXECUTION-CHECKLIST.md** - Detailed test cases
2. **BUGS-FIXED-PRE-TESTING.md** - Critical bugs already fixed
3. **E2E-TESTING-GUIDE.md** - Original comprehensive plan

### Helper Scripts
- `setup-test-drivers.js` - Reset test drivers in MongoDB

---

## ✅ System Ready!

Everything is configured and running. You can now:

1. **Scan QR code** with Expo Go on Android device
2. **Open checklist**: `E2E-TESTING-EXECUTION-CHECKLIST.md`
3. **Start testing**: Begin with Authentication tests
4. **Document findings**: Note any bugs or issues
5. **Have fun!** 🚀

**Estimated Testing Time:**
- Quick smoke test: 2-3 hours
- Full comprehensive test: 6-8 hours
- Thorough QA cycle: 1-2 days

---

**Happy Testing! You're acting as an expert passenger system tester. Be thorough, be critical, and document everything you find! 🧪**
