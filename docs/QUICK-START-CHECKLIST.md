# 🚀 CabConnect E2E Testing - Quick Start Checklist

**Last Updated:** February 14, 2026  
**Testing Mode:** Manual Testing on Android  
**Environment:** Local Development

---

## ✅ SETUP COMPLETE - READY TO TEST!

### Environment Status
- ✅ **Backend Server:** Running on port 5000
- ✅ **MongoDB:** Connected on port 27017
- ✅ **Passenger App:** Configured for network testing
- ✅ **Network IP:** 192.168.0.133
- ✅ **Mock OTP:** 123456 (enabled)

---

## 🎯 CRITICAL: Apply Fixes Before Testing

### Fix 1: WebSocket Token Key (CRITICAL)
**File:** `cabconnect-passenger-app/contexts/SocketContext.tsx`

**Change Line 37:**
```typescript
// FROM:
const token = await AsyncStorage.getItem('token');

// TO:
const TOKEN_KEY = '@auth/token';
const token = await AsyncStorage.getItem(TOKEN_KEY);
```

### Fix 2: Update CORS Origins (RECOMMENDED)
**File:** `cabconnect-backend-main/.env`

**Update Line 12:**
```env
# FROM:
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

# TO:
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://192.168.0.133:8081,http://192.168.0.133:19006
```

**Then restart backend server:**
```bash
# Stop current server (Ctrl+C)
# Restart:
cd d:\Projects\08_CC\cabconnect-apps\cabconnect-backend-main
npm run dev
```

---

## 📱 START TESTING IN 5 STEPS

### Step 1: Setup Test Data (2 minutes)

**Run this in MongoDB:**
```bash
# Option A: Using mongosh
mongosh mongodb://127.0.0.1:27017/ridehailing < d:\Projects\08_CC\cabconnect-apps\cabconnect-docs\mongodb-test-data-setup.js

# Option B: Copy/paste in MongoDB Compass
# Open the script file and paste into Compass shell
```

**This creates:**
- 3 test drivers (2 online, 1 offline)
- 2 test passengers (with sample ride history)
- Geospatial indexes

---

### Step 2: Start Passenger App (1 minute)

```bash
cd d:\Projects\08_CC\cabconnect-apps\cabconnect-passenger-app
npx expo start
```

**Scan QR code** with Expo Go on Android device

---

### Step 3: Run First Test - Signup (5 minutes)

**Test: New User Signup**

1. **Open app** → Welcome screen (waits 2.5s) → Auto-redirects to Signup
2. **Fill form:**
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `Test1234!`
   - Confirm: `Test1234!`
3. **Check password strength:** Should show "Strong" (green)
4. **Tap "Sign Up"** → OTP modal appears
5. **Enter OTP:** `123456` (mock code)
6. **Success!** → Auto-login → Redirects to Home tab

**✅ Pass Criteria:**
- No crashes
- OTP modal appears and accepts `123456`
- Successful redirect to Home
- Backend logs show: `User created: testuser@example.com`

**❌ Fail:**
- App crashes
- OTP rejected
- Stuck on signup screen

---

### Step 4: Run Second Test - Ride Booking (10 minutes)

**Test: Complete Ride Flow**

1. **From Home** → Tap "Book a Ride" button
2. **Find Ride Screen:**
   - From: Type "Thurston Gardens, Suva" → Select
   - To: Type "University of South Pacific" → Select
   - Tap "Find Now"
3. **Confirm Ride Screen:**
   - Fare estimate should load (~2 seconds)
   - Check breakdown: Base + Distance + Time + Tax = Total
   - Tap "Request Ride"
4. **Book Ride Screen:**
   - Shows "Requesting Ride..." then "Finding Driver..."
   - **Within 10 seconds:** Driver card should appear
   - Check: Driver name, vehicle, plate, rating displayed
5. **Simulate Completion:**
   - In MongoDB Compass, run:
     ```javascript
     db.rides.findOne({status: 'searching'}) // Get ride ID
     db.rides.updateOne(
       {_id: ObjectId('YOUR_RIDE_ID')},
       {$set: {status: 'completed', completedAt: new Date()}}
     )
     ```
6. **Trip Complete Screen:**
   - App auto-navigates
   - Shows ride receipt
   - Rate 5 stars → "Submit Rating"
   - Tap "Book Another Ride" → Returns to Home

**✅ Pass Criteria:**
- Fare estimate loads successfully
- Driver assigned within 10 seconds (check backend logs)
- WebSocket updates work (driver card appears)
- Ride appears in History tab

**❌ Fail:**
- Fare estimate times out
- No driver assigned (check WebSocket connection)
- App doesn't navigate to Trip Complete

---

### Step 5: Quick Validation Tests (5 minutes)

**Test A: Profile Photo Upload**
1. Go to Profile tab
2. Tap camera icon on profile photo
3. Choose from gallery → Select image
4. Crop (1:1 ratio) → Confirm
5. **Check:** Photo updates in profile

**Test B: Saved Places**
1. Profile → Saved Places
2. Tap "Add Home"
3. Search: "Thurston Gardens, Suva"
4. Save → **Check:** Home card appears
5. Go to Home tab → **Check:** Home card visible

**Test C: Ride History**
1. Go to Rides tab → "Past"
2. **Check:** Completed ride from Step 4 appears
3. Tap ride → **Check:** Full details shown

---

## 🐛 Expected Issues (Document These)

### Issue 1: WebSocket May Not Connect
**If you see:**
- "Finding Driver..." stays forever
- No driver assigned

**Cause:** Socket token key bug (if not fixed)

**Workaround:** None. Must fix BUG-001 first.

**Document:**
- Screenshot of stuck screen
- Backend logs showing WebSocket error

---

### Issue 2: CORS Errors
**If you see:**
- API calls fail with "Network Error"
- Backend logs show CORS errors

**Cause:** CORS origins not configured for network IP

**Workaround:** Update `.env` and restart backend (see Fix 2 above)

---

## 📊 Test Results Template

Use this to track your progress:

```markdown
# Test Session Report

**Date:** [Date/Time]
**Tester:** [Your Name]
**Device:** Android [Model], [OS Version]
**Network:** [WiFi name]

## Quick Tests

| Test | Status | Time | Notes |
|------|--------|------|-------|
| Signup | ⏳ | | |
| Login | ⏳ | | |
| Fare Estimate | ⏳ | | |
| Book Ride | ⏳ | | |
| Driver Assignment | ⏳ | | |
| Trip Complete | ⏳ | | |
| Profile Photo | ⏳ | | |
| Saved Places | ⏳ | | |
| Ride History | ⏳ | | |

## Issues Found

1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Screenshot: [filename]
   - Logs: [paste]

## Overall Status
☐ All tests passed
☐ Minor issues found
☐ Critical bugs found (testing blocked)
```

---

## 🎬 Full Test Suite (After Quick Tests Pass)

Once basic tests work, proceed with comprehensive testing:

### Day 1: Core Features (2-3 hours)
- ✅ All authentication flows
- ✅ Complete ride booking
- ✅ Profile management
- ✅ Saved places

### Day 2: Edge Cases (2-3 hours)
- ✅ Geofence validation
- ✅ No drivers available
- ✅ Network errors
- ✅ Session expiry
- ✅ Account deletion

### Day 3: Real-time & Polish (1-2 hours)
- ✅ WebSocket stability
- ✅ Status updates
- ✅ Dark mode
- ✅ Animations
- ✅ Haptic feedback

---

## 📞 Quick Reference

**Backend API:** `http://192.168.0.133:5000`  
**Health Check:** http://192.168.0.133:5000/health  
**MongoDB:** `mongodb://127.0.0.1:27017/ridehailing`

**Test Credentials:**
- **Mock OTP:** `123456`
- **Driver:** `driver1@test.com` / `Driver123!`
- **Passenger:** `passenger1@test.com` / `Pass1234!`

**Test Locations (Suva):**
- Pickup: "Thurston Gardens, Suva"
- Dropoff: "University of South Pacific, Laucala Bay"
- Out of area: "Savusavu, Fiji" (for testing geofence)

**MongoDB Quick Commands:**
```javascript
// View all users
db.users.find().pretty()

// View online drivers
db.drivers.find({isOnline: true}).pretty()

// View recent rides
db.rides.find().sort({createdAt: -1}).limit(5).pretty()

// Mark driver as online
db.drivers.updateOne({name: "John Ravouvou"}, {$set: {isOnline: true}})

// Complete a ride
db.rides.updateOne(
  {status: 'searching'},
  {$set: {status: 'completed', completedAt: new Date()}}
)
```

---

## 🎯 Success Criteria

### Must Work:
- ✅ User can signup and login
- ✅ Fare estimate displays
- ✅ Ride can be booked
- ✅ Profile can be edited
- ✅ No crashes during normal flow

### Should Work:
- ✅ WebSocket updates (driver assignment)
- ✅ Saved places
- ✅ Profile photo upload
- ✅ Ride history

### Nice to Have:
- ✅ Smooth animations
- ✅ Dark mode
- ✅ Haptic feedback

---

## 📝 Documentation Files

All testing documentation is in `cabconnect-docs/`:

1. **E2E-TESTING-GUIDE.md** - Full comprehensive plan (26 pages)
2. **BUG-REPORT-E2E-TESTING.md** - Known issues and fixes
3. **mongodb-test-data-setup.js** - Test data script
4. **QUICK-START-CHECKLIST.md** - This file

---

**Ready to start testing! 🚀**

**Next Step:** Apply critical fixes (Fix 1 & 2 above), then run Step 1-5!
