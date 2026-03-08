# 🧪 END-TO-END TESTING CHECKLIST (Before Production Deployment)

**Date**: February 11, 2026  
**Target**: Fiji Market (Cash-based)  
**Test Environment**: Local (Backend: localhost:5000, Passenger App: Expo)

---

## ✅ PRE-TEST SETUP

### 1. Backend Server Running
```bash
cd d:\Projects\08_CC\cabconnect-apps\cabconnect-backend-main
npm start
```

**Expected Output:**
```
✅ JWT_SECRET loaded (128 chars)
✅ Redis connected: localhost:6379
✅ MongoDB connected
✅ Production environment validation passed (or skipped if NODE_ENV=development)
🚀 Server running on port 5000
```

**If Redis not running:**
```
⚠️  Redis connection failed, using graceful degradation
✅ MongoDB connected
🚀 Server running on port 5000
```

### 2. Passenger App Running
```bash
cd d:\Projects\08_CC\cabconnect-apps\cabconnect-passenger-app
npm start -- --reset-cache
```

**Expected:**
- Metro bundler starts
- QR code displayed
- Expo Go app connected

### 3. Create Test Driver Account

**Option A: Via MongoDB Compass/Studio**
```javascript
// Insert into 'users' collection
{
  name: "Test Driver",
  email: "driver@test.com",
  phone: "+679 999 1234",
  passwordHash: "$2a$12$...", // Use bcrypt to hash "password123"
  role: "driver",
  createdAt: new Date(),
  updatedAt: new Date()
}

// Insert into 'drivers' collection
{
  userId: ObjectId("..."), // Use the _id from above user
  name: "Test Driver",
  vehicle: "Toyota Prius",
  plateNumber: "FJ-1234",
  rating: 5.0,
  isOnline: true,
  lastLocation: {
    latitude: -18.1416,  // Suva city center
    longitude: 178.4419
  },
  lastLocationUpdate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**Option B: Use backend API (if signup exists for drivers)**

---

## 📋 TEST SCENARIOS

### TEST 1: Authentication Flow ✅

#### 1.1 Sign Up New Passenger
1. Open app → "Get Started"
2. Email: `test@cabconnect.fj`
3. Password: `Test1234!`
4. Name: `Test Passenger`
5. Phone: `+679 999 5678`
6. Tap "Sign Up"

**Expected:**
- ✅ Shows "OTP sent to your email"
- ✅ Backend logs: `[OTP] Sent to test@cabconnect.fj: 123456` (if mock enabled)
- ✅ OTP input screen appears

#### 1.2 Verify OTP
1. Enter OTP: `123456` (if mock) or check email
2. Tap "Verify"

**Expected:**
- ✅ OTP verified successfully
- ✅ Navigate to home screen
- ✅ Token stored in AsyncStorage

#### 1.3 Logout and Login
1. Home → Tap profile icon → Logout
2. Login screen → Enter email + password
3. Tap "Login"

**Expected:**
- ✅ Login successful
- ✅ Navigate to home screen
- ✅ Session persists (close app, reopen → still logged in)

---

### TEST 2: Ride Booking Flow (CRITICAL) ✅

#### 2.1 Setup Locations
1. **Home Tab** → Allow location permission
2. Wait for current location to load

**Expected:**
- ✅ Shows "Good Morning/Afternoon/Evening, [Name]"
- ✅ Current location displayed (or default)

#### 2.2 Set Pickup (Suva City Center)
1. Tap "Where would you like to go?" input
2. Search: "Suva City Centre" or manually enter
3. Select location

**Coordinates to use**: `-18.1416, 178.4419`

#### 2.3 Set Dropoff (Suva Hospital)
1. Tap destination input
2. Search: "Colonial War Memorial Hospital, Suva"
3. Select location

**Coordinates to use**: `-18.1385, 178.4285`

#### 2.4 Get Fare Estimate
1. Tap "Find Now"
2. Wait for estimate calculation

**Expected:**
- ✅ Loading: "Calculating fare..."
- ✅ Fare breakdown appears:
  ```
  Base Fare         FJD 3.00
  Distance (1.5 km) FJD 2.25
  Time (5 min)      FJD 1.00
  ─────────────────────────────
  Total             FJD 6.25
  ```
- ✅ Backend logs (1st request): `[Maps] Cache miss, calling Google Maps API`
- ✅ Backend logs (2nd request): `[Maps] Cache hit: route:...`

#### 2.5 Test Geofence (Out of Service Area)
**Optional Test**: Set dropoff to coordinates outside Fiji (e.g., Australia)
- Pickup: `-18.1416, 178.4419` (Suva - valid)
- Dropoff: `-33.8688, 151.2093` (Sydney - invalid)

**Expected:**
- ✅ Alert: "Out of Service Area"
- ✅ Shows: "Nearest service area: Suva, Fiji (X km away)"

#### 2.6 Book Ride
1. Back to valid locations
2. Get estimate
3. Tap "Request Ride"

**Expected:**
- ✅ Shows "Finding a driver for you..." spinner
- ✅ Socket connects (check terminal logs)
- ✅ Backend logs:
  ```
  [Matching] Attempt 1: Searching for drivers within 10km
  ✅ [Matching] Assigned driver ... (1.2km away)
  ✅ [Matching] Ride ... assigned to driver ...
  ```

#### 2.7 Driver Assignment
**Within 1-3 seconds:**

**Expected:**
- ✅ Spinner disappears
- ✅ Driver card appears:
  - Name: "Test Driver"
  - Rating: 5.0 ⭐
  - Vehicle: "Toyota Prius • FJ-1234"
- ✅ Status: "Your Driver is on the way!"
- ✅ Fare displayed: FJD 6.25

#### 2.8 Cancel Ride
1. Tap "Cancel Ride" button (red)
2. Confirmation dialog appears
3. Tap "Yes, Cancel"

**Expected:**
- ✅ Shows loading spinner
- ✅ Alert: "Ride Cancelled"
- ✅ Navigate back to home
- ✅ Active ride cleared
- ✅ Backend logs: `Ride ... cancelled by passenger`

---

### TEST 3: No Drivers Available ✅

#### 3.1 Set All Drivers Offline
**Via MongoDB Compass:**
```javascript
db.drivers.updateMany({}, { $set: { isOnline: false } })
```

#### 3.2 Book Ride
1. Set pickup and dropoff
2. Get estimate
3. Request ride

**Expected:**
- ✅ Shows "Finding a driver..." spinner
- ✅ Backend logs:
  ```
  [Matching] Attempt 1: Searching within 10km
  [Matching] No drivers found within 10km, expanding...
  [Matching] Attempt 2: Searching within 15km
  [Matching] Attempt 3: Searching within 20km
  [Matching] No available drivers found after all attempts
  ```
- ✅ Alert: "No Drivers Available - We'll keep searching"
- ✅ Ride stays in "searching" status

#### 3.3 Re-enable Driver
```javascript
db.drivers.updateMany({}, { $set: { isOnline: true } })
```

---

### TEST 4: Idempotency (Prevent Duplicates) ✅

#### 4.1 Network Inspector Setup
1. Open Expo Dev Tools → Network tab
2. Or use browser debugger if testing web version

#### 4.2 Book Ride
1. Request a ride
2. Copy the `Idempotency-Key` header value
3. Complete or cancel the ride

#### 4.3 Replay Request
**Via Postman/curl:**
```bash
curl -X POST http://localhost:5000/ride/book \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: COPIED_KEY" \
  -d '{ "pickup": {...}, "dropoff": {...}, "fare": 6.25 }'
```

**Expected:**
- ✅ Returns 201 with cached response
- ✅ Backend logs: `[Idempotency] Cache hit for key...`
- ✅ No duplicate ride created in database

---

### TEST 5: Rate Limiting ✅

#### 5.1 Test Estimate Rate Limit
**Make 11 rapid requests to `/ride/estimate`** (within 1 minute)

**Via browser console or Postman:**
```javascript
for (let i = 0; i < 11; i++) {
  fetch('http://localhost:5000/ride/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup: { coords: { latitude: -18.1416, longitude: 178.4419 } },
      dropoff: { coords: { latitude: -18.1385, longitude: 178.4285 } }
    })
  }).then(r => r.json()).then(console.log);
}
```

**Expected:**
- ✅ First 10 requests: 200 OK
- ✅ 11th request: 429 Too Many Requests
- ✅ Response: `{ message: "Too many fare estimate requests...", retryAfter: 60 }`

---

### TEST 6: Ride History ✅

#### 6.1 Complete a Ride First
**Via MongoDB Compass (simulate completion):**
```javascript
db.rides.updateOne(
  { _id: ObjectId("YOUR_RIDE_ID") },
  { 
    $set: { 
      status: "completed",
      completedAt: new Date()
    }
  }
)
```

#### 6.2 View History
1. Open app → **Rides Tab**
2. Pull down to refresh

**Expected:**
- ✅ Shows loading spinner
- ✅ GET /history request sent
- ✅ Displays completed ride card with:
  - Pickup/dropoff addresses
  - Fare: FJD 6.25
  - Date/time
  - Driver name
  - Status badge: "PAID" (green)
- ✅ Pull-to-refresh works

---

### TEST 7: Socket.io Real-Time ✅

#### 7.1 Check Socket Connection
**In passenger app terminal:**
```
✅ Socket connected: abc123xyz
```

#### 7.2 Test Live Updates
1. Book a ride (driver assigned)
2. Open MongoDB Compass
3. Manually update ride status:
```javascript
db.rides.updateOne(
  { _id: ObjectId("YOUR_RIDE_ID") },
  { $set: { status: "arriving" } }
)
```
4. Manually emit Socket event via backend console:
```javascript
// Run in backend terminal (node REPL)
const { emitToUser } = require('./dist/realtime');
emitToUser('PASSENGER_USER_ID', 'ride:update', {
  rideId: 'YOUR_RIDE_ID',
  status: 'arriving'
});
```

**Expected:**
- ✅ Passenger app updates instantly (no refresh needed)
- ✅ Status changes from "accepted" to "arriving"

---

### TEST 8: Trip Completion Flow ✅

#### 8.1 Complete Ride
**Via MongoDB:**
```javascript
db.rides.updateOne(
  { _id: ObjectId("YOUR_RIDE_ID") },
  { 
    $set: { 
      status: "completed",
      completedAt: new Date()
    }
  }
)
```

#### 8.2 Emit Completion Event
**Backend console:**
```javascript
const { emitToUser } = require('./dist/realtime');
emitToUser('PASSENGER_USER_ID', 'ride:update', {
  rideId: 'YOUR_RIDE_ID',
  status: 'completed'
});
```

**Expected:**
- ✅ App auto-navigates to trip-complete screen
- ✅ Shows:
  - ✓ Success checkmark
  - Driver card (photo, name, rating, vehicle)
  - Trip details (pickup, dropoff, distance, time)
  - Fare breakdown
  - 5-star rating interface

#### 8.3 Submit Rating
1. Tap 5 stars
2. Tap "Submit Rating"

**Expected:**
- ✅ POST to `/ride/{id}/rate`
- ✅ Alert: "Thank You! Your rating has been submitted"
- ✅ Navigate to home

---

### TEST 9: Forgot Password Flow ✅

1. Login screen → "Forgot Password?"
2. Enter email
3. Verify OTP
4. Enter new password

**Expected:**
- ✅ OTP sent to email
- ✅ Password updated successfully
- ✅ Can login with new password

---

### TEST 10: Edge Cases ✅

#### 10.1 Network Interruption
1. Book a ride
2. Turn off WiFi/mobile data
3. Turn back on after 10 seconds

**Expected:**
- ✅ Socket disconnects
- ✅ Socket auto-reconnects within 5s
- ✅ Console: `✅ Socket reconnected after X attempts`

#### 10.2 Invalid Locations
1. Set pickup with no coordinates
2. Tap "Find Now"

**Expected:**
- ✅ Error: "Please select pickup and drop-off locations"

#### 10.3 Session Expiry
1. Manually delete token from AsyncStorage (or wait 7 days)
2. Try to book ride

**Expected:**
- ✅ 401 Unauthorized
- ✅ Redirect to login screen

---

## 🚨 CRITICAL BUGS TO WATCH

### Backend:
- [ ] Port 5000 already in use → Kill existing process
- [ ] MongoDB connection failed → Check MongoDB is running
- [ ] JWT_SECRET error → Check .env file exists
- [ ] Redis connection timeout → Redis not running (acceptable, graceful degradation)

### Frontend:
- [ ] "Network request failed" → Backend not running or wrong API_URL
- [ ] OTP never arrives → Check Brevo API key, email spam folder
- [ ] Socket won't connect → Check CORS, JWT token valid
- [ ] Map markers not showing → Check Google Maps API key

---

## ✅ TEST COMPLETION CHECKLIST

Before proceeding to deployment, verify:

**Authentication:**
- [ ] Sign up with OTP works
- [ ] Login with email/password works
- [ ] Forgot password flow works
- [ ] Session persists after app restart
- [ ] Logout clears session

**Ride Booking:**
- [ ] Pickup and dropoff selection works
- [ ] Fare estimate shows breakdown (FJD)
- [ ] Geofence validates Fiji locations
- [ ] Out-of-service-area shows error
- [ ] Ride booking creates ride in DB
- [ ] Driver auto-assigned within 3 seconds
- [ ] Socket.io shows driver info in real-time
- [ ] Cancel ride works with confirmation

**Ride Completion:**
- [ ] Simulated completion navigates to receipt screen
- [ ] Trip details displayed correctly
- [ ] Rating submission works
- [ ] Navigate to home after rating

**Ride History:**
- [ ] Rides tab shows actual data from /history
- [ ] Pull-to-refresh updates list
- [ ] Completed rides display correctly

**Performance:**
- [ ] 2nd fare estimate is faster (Redis cache)
- [ ] No crashes or hangs
- [ ] Socket reconnects after interruption

---

## 📊 Expected Test Results

**If all tests pass:**
✅ Backend: Fully functional  
✅ Passenger App: Production-ready  
✅ Socket.io: Real-time working  
✅ Security: All vulnerabilities fixed  
✅ Ready for deployment ✈️

**If any test fails:**
❌ STOP - Fix issues before deployment  
❌ Check logs for error details  
❌ Re-test after fix

---

## 🚀 NEXT STEP AFTER TESTING

Once all tests pass, proceed to:
→ **PRODUCTION DEPLOYMENT GUIDE** (see below)

---

