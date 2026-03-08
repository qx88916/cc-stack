# CabConnect Passenger System - E2E Testing Guide

## 🎯 Testing Environment Status

### ✅ Environment Setup Complete

**Backend Server:**
- Status: Running ✅
- URL: `http://localhost:5000` (local) / `http://192.168.0.133:5000` (network)
- Health Check: Confirmed working
- MongoDB: Connected ✅
- WebSocket: Enabled ✅
- Mock OTP: `123456` (configured)

**Passenger App:**
- API URL: `http://192.168.0.133:5000` ✅
- Google Places API: Configured ✅
- Ready for Expo Go testing

**Database:**
- MongoDB: Running on port 27017 ✅
- Database: `ridehailing`

---

## 🚀 Quick Start Testing

### Prerequisites Checklist

- [x] Backend server running
- [x] MongoDB connected
- [x] `.env` files configured
- [x] Local network IP: `192.168.0.133`
- [ ] Test drivers created (see below)
- [ ] Android device connected to same network
- [ ] Expo Go installed on device

### Start Testing in 3 Steps

1. **Start Passenger App:**
   ```bash
   cd d:\Projects\08_CC\cabconnect-apps\cabconnect-passenger-app
   npx expo start
   ```

2. **Scan QR code** with Expo Go on Android device

3. **Begin Test Suite 1** (Authentication Flow)

---

## 📋 Test Execution Order

Follow this sequence for systematic testing:

### Phase 1: Core Functionality (Critical) ⭐
1. **Authentication** (Test Suite 1)
   - [ ] 1.1 New User Signup with OTP
   - [ ] 1.2 Login with Email/Password
   - [ ] 1.3 Forgot Password Flow
   - [ ] 1.4 Email Verification

2. **Ride Booking** (Test Suite 2)
   - [ ] 2.1 Find Ride (Location Selection)
   - [ ] 2.2 Confirm Ride (Fare Estimate)
   - [ ] 2.3 Book Ride (Driver Assignment)
   - [ ] 2.4 Trip Complete (Rating)

### Phase 2: Profile & Settings
3. **Profile Management** (Test Suite 3)
   - [ ] 3.1 View Profile
   - [ ] 3.2 Edit Profile
   - [ ] 3.3 Profile Photo Upload

4. **Saved Places** (Test Suite 4)
   - [ ] 4.1 View Saved Places
   - [ ] 4.2 Add Home/Work Location
   - [ ] 4.3 Edit/Delete Saved Place
   - [ ] 4.4 Quick Book from Home Tab

### Phase 3: History & Real-time
5. **Ride History** (Test Suite 5)
   - [ ] 5.1 View Past Rides
   - [ ] 5.2 View Upcoming Rides
   - [ ] 5.3 Rebook Previous Ride
   - [ ] 5.4 View Ride Details

6. **Real-Time Features** (Test Suite 6)
   - [ ] 6.1 WebSocket Connection
   - [ ] 6.2 Driver Assignment Events
   - [ ] 6.3 Ride Status Updates

### Phase 4: Edge Cases & Robustness
7. **Edge Cases** (Test Suite 7)
   - [ ] 7.1 Geofence Validation
   - [ ] 7.2 No Drivers Available
   - [ ] 7.3 Network Errors
   - [ ] 7.4 Duplicate Booking Prevention
   - [ ] 7.5 Session Expiry
   - [ ] 7.6 Account Deletion

8. **UI/UX** (Test Suite 8)
   - [ ] 8.1 Responsive Design
   - [ ] 8.2 Dark Mode
   - [ ] 8.3 Haptic Feedback
   - [ ] 8.4 Animations

---

## 🧪 Test Data Setup

### Create Test Drivers (MongoDB)

Use MongoDB Compass or mongosh to create test drivers:

```javascript
// Connect to: mongodb://127.0.0.1:27017/ridehailing

// Collection: users
db.users.insertOne({
  email: "driver1@test.com",
  phone: "+6791234567",
  name: "Test Driver 1",
  role: "driver",
  passwordHash: "$2b$10$YourHashHere", // or create via signup
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Collection: drivers
db.drivers.insertOne({
  userId: "<user_id_from_above>",
  isOnline: true,
  name: "Test Driver 1",
  phone: "+6791234567",
  vehicle: {
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "Silver"
  },
  plateNumber: "FJ1234",
  rating: 4.8,
  totalRides: 150,
  lastLocation: {
    type: "Point",
    coordinates: [178.4419, -18.1416] // Suva coordinates
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

**Quick Test Locations (Within Geofence):**

**Suva Area:**
- Pickup: `Thurston Gardens, Suva` (-18.1415, 178.4419)
- Dropoff: `University of South Pacific, Laucala Bay` (-18.1134, 178.4627)

**Nadi Area:**
- Pickup: `Nadi International Airport` (-17.7554, 177.4434)
- Dropoff: `Denarau Island, Nadi` (-17.7869, 177.3949)

**Out of Geofence (For Testing):**
- `Savusavu, Fiji` (-16.7826, 179.3299)

---

## 🔍 Critical Issues to Watch For

### Known Bugs (From Plan Analysis)

1. **🔴 CRITICAL: Socket Token Mismatch**
   - **Issue:** SocketContext uses `AsyncStorage.getItem('token')` but AuthContext stores as `@auth/token`
   - **Impact:** WebSocket connection will fail, no real-time updates
   - **Test:** Monitor backend logs during ride booking
   - **Expected:** Socket connection error in logs
   - **File:** `cabconnect-passenger-app/contexts/SocketContext.tsx` (if exists)

2. **🟠 HIGH: Email Suggestion Undefined**
   - **Issue:** `suggestEmailDomain` imported in signup but not implemented
   - **Impact:** Runtime error during signup
   - **Test:** Type misspelled email like "test@gmial.com"
   - **Expected:** App crashes or error
   - **File:** `cabconnect-passenger-app/app/(auth)/signup.tsx`

3. **🟡 MEDIUM: Geofence Edge Cases**
   - **Issue:** Boundary coordinates may not validate correctly
   - **Impact:** Some valid locations rejected
   - **Test:** Use coordinates near geofence boundaries
   - **Expected:** Inconsistent validation

---

## 📊 Test Results Template

Use this template to document your findings:

### Test Session: [Date/Time]

**Environment:**
- Backend Version: [git commit hash]
- App Version: 1.0.0
- Device: [Android model, OS version]
- Network: [WiFi/Mobile]

**Test Suite 1: Authentication**
| Test Case | Status | Notes | Severity |
|-----------|--------|-------|----------|
| 1.1 Signup with OTP | ⏳ | | |
| 1.2 Login | ⏳ | | |
| 1.3 Forgot Password | ⏳ | | |
| 1.4 Email Verification | ⏳ | | |

**Bugs Found:**
1. [BUG-001] Socket token mismatch
   - **Severity:** Critical
   - **Steps:** Login → Book ride → Check logs
   - **Expected:** Socket connects
   - **Actual:** Connection fails with auth error
   - **Screenshot:** [attach]

**Performance Notes:**
- API Response Times: [average ms]
- UI Lag: [none/minor/major]
- Memory Usage: [stable/leaking]

---

## 🛠️ Testing Tools & Commands

### Monitor Backend Logs
Backend logs are visible in the terminal where `npm run dev` is running.

### Check MongoDB Data
```bash
# Using mongosh
mongosh mongodb://127.0.0.1:27017/ridehailing

# View collections
show collections

# View users
db.users.find().pretty()

# View rides
db.rides.find().sort({createdAt: -1}).limit(5).pretty()

# View drivers
db.drivers.find({isOnline: true}).pretty()
```

### Clear Test Data
```javascript
// Clear all test data (careful!)
db.users.deleteMany({email: {$regex: '@test.com$'}});
db.rides.deleteMany({});
```

### Simulate Ride Status Changes
```javascript
// Change ride status manually for testing
db.rides.updateOne(
  {_id: ObjectId('your_ride_id')},
  {$set: {status: 'completed', completedAt: new Date()}}
);
```

---

## 🎬 Detailed Test Scenarios

### Scenario 1: Complete Happy Path (30 mins)

**Goal:** Test full user journey from signup to completed ride.

1. **Signup** (5 mins)
   - Open app → Welcome → Auto-redirect to Signup
   - Enter: Name: "Test User", Email: "test@example.com", Password: "Test1234!"
   - Verify password strength indicator shows "Strong"
   - Click "Sign Up" → OTP modal appears
   - Enter OTP: `123456` → Success → Auto-login → Home screen

2. **Add Saved Places** (5 mins)
   - Navigate to Profile → Saved Places
   - Add Home: "Thurston Gardens, Suva"
   - Add Work: "University of South Pacific"
   - Verify both appear on Home tab

3. **Book First Ride** (10 mins)
   - From Home → Tap "Work" card (quick book)
   - Enter pickup: "Suva City Centre"
   - Tap "Find Now" → Confirm Ride screen
   - Verify fare estimate loads (base + distance + time)
   - Tap "Request Ride" → Book Ride screen
   - Wait for driver assignment (should be < 10 seconds if test driver online)
   - Verify driver card displays: name, photo, vehicle, plate, rating
   - **Manual:** In MongoDB, change ride status to `completed`
   - App auto-navigates to Trip Complete

4. **Rate & Review** (3 mins)
   - View trip receipt (fare breakdown)
   - Select 5 stars
   - Tap "Submit Rating" → Success
   - Tap "Book Another Ride" → Returns to Home

5. **View History** (2 mins)
   - Navigate to Rides tab → Past
   - Verify completed ride appears
   - Tap ride → View details

6. **Profile & Logout** (5 mins)
   - Navigate to Profile
   - Upload profile photo (gallery)
   - Edit profile (change name)
   - Logout → Redirects to Welcome

**Success Criteria:**
- ✅ All steps complete without errors
- ✅ Real-time updates work (driver assignment)
- ✅ Data persists correctly
- ✅ UI smooth and responsive

---

### Scenario 2: Error Handling Path (20 mins)

**Goal:** Test system robustness with edge cases.

1. **Geofence Validation** (5 mins)
   - Book ride with pickup in Suva
   - Set destination to "Savusavu, Fiji" (out of geofence)
   - Tap "Find Now" → Confirm Ride
   - **Expected:** Error message "Destination outside service area"
   - Verify cannot proceed to booking

2. **No Drivers Available** (5 mins)
   - **Setup:** In MongoDB, set all drivers `isOnline: false`
   - Book a valid ride (Suva to Suva)
   - **Expected:** After 30 seconds, "No Drivers Available" message
   - Verify options: "Try Again" and "Cancel"
   - Tap "Cancel" → Returns to Home

3. **Network Interruption** (5 mins)
   - Start booking a ride
   - Turn off WiFi during fare estimate
   - **Expected:** Error banner "Network error. Check connection."
   - Turn WiFi back on → Tap retry
   - **Expected:** Estimate loads successfully

4. **Session Expiry** (5 mins)
   - **Setup:** Manually modify JWT token in AsyncStorage (corrupt it)
   - Try to access Profile or Book Ride
   - **Expected:** Redirect to Login with "Session expired" message

**Success Criteria:**
- ✅ All errors handled gracefully (no crashes)
- ✅ Error messages clear and actionable
- ✅ User can recover from errors

---

## 📱 Device Testing Checklist

### Android Specific

- [ ] App installs via Expo Go
- [ ] Splash screen displays correctly
- [ ] Permissions requested (Location, Camera, Gallery)
- [ ] Back button navigation works
- [ ] Deep links work (if applicable)
- [ ] App doesn't crash on background/foreground
- [ ] Keyboard doesn't overlap input fields
- [ ] StatusBar color correct

### Network Conditions

- [ ] WiFi connected
- [ ] Mobile data (if available)
- [ ] Slow 3G simulation
- [ ] Network interruption recovery

---

## 🎯 Pass/Fail Criteria

### Must Pass (Critical)
- ✅ User can signup and login
- ✅ User can book a ride
- ✅ Fare estimate displays correctly
- ✅ Ride history accessible
- ✅ Profile editable
- ✅ No crashes during normal flow

### Should Pass (High Priority)
- ✅ Real-time driver assignment
- ✅ WebSocket status updates
- ✅ Profile photo upload
- ✅ Saved places work
- ✅ Geofence validation
- ✅ Error messages display

### Nice to Have (Medium Priority)
- ✅ Animations smooth
- ✅ Dark mode support
- ✅ Haptic feedback
- ✅ Email verification

---

## 📝 Final Testing Report Template

```markdown
# CabConnect Passenger App - E2E Test Report

**Date:** [Date]
**Tester:** [Your Name]
**Duration:** [X hours]
**Device:** Android [Model], [OS Version]

## Executive Summary
- Total Test Cases: [X]
- Passed: [X]
- Failed: [X]
- Blocked: [X]

## Critical Issues Found
1. [Issue title] - [Severity]
2. [Issue title] - [Severity]

## Test Suite Results

### 1. Authentication (4 test cases)
✅ PASSED: 3
❌ FAILED: 1
- Issue: [Description]

### 2. Ride Booking (4 test cases)
[Status summary]

### 3-8. [Continue for all suites]

## Performance Observations
- Average API response: [X ms]
- App launch time: [X seconds]
- Memory usage: [X MB]

## Recommendations
1. [Priority 1] Fix socket token mismatch
2. [Priority 2] Implement email suggestion helper
3. [Priority 3] Improve geofence boundary handling

## Overall Assessment
[PASS / CONDITIONAL PASS / FAIL]

[Summary paragraph]
```

---

## 🚀 Next Steps After Testing

1. **Document all bugs** in GitHub Issues (if available) or this file
2. **Share test report** with development team
3. **Prioritize fixes** based on severity
4. **Retest critical bugs** after fixes
5. **Prepare for staging deployment** testing

---

## 📞 Quick Reference

**Backend API:** `http://192.168.0.133:5000`  
**Health Check:** `http://192.168.0.133:5000/health`  
**MongoDB:** `mongodb://127.0.0.1:27017/ridehailing`  
**Mock OTP:** `123456`  

**Test Credentials:**
- Email: `test@example.com`
- Password: `Test1234!`

**Test Locations (Suva):**
- Pickup: "Thurston Gardens, Suva"
- Dropoff: "USP, Laucala Bay"

---

**Good luck with your testing! 🎯**
