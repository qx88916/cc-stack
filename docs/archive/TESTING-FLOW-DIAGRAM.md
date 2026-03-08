# CabConnect E2E Testing - Visual Test Flow

## 🎯 Complete Testing Journey Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CABCONNECT E2E TESTING FLOW                      │
│                    Manual Testing on Android Device                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 0: PRE-TESTING SETUP (5 minutes)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ✅ Backend running on 192.168.0.133:5000                           │
│  ✅ MongoDB connected (port 27017)                                   │
│  ✅ App configured with network IP                                   │
│  ⚠️  CRITICAL: Fix WebSocket token key bug                          │
│  ⚠️  OPTIONAL: Fix CORS origins                                     │
│  📊 Load test data (mongodb-test-data-setup.js)                     │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: AUTHENTICATION TESTING (20 minutes)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 1.1: New User Signup                                    │  │
│  │  Welcome → Signup → Enter details → OTP (123456) → Home     │  │
│  │  ✓ Password strength indicator works                        │  │
│  │  ✓ Email validation real-time                               │  │
│  │  ✓ OTP modal accepts mock code                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 1.2: Login & Session                                   │  │
│  │  Login screen → Email + Password → Home                     │  │
│  │  Close app → Reopen → Still logged in                       │  │
│  │  ✓ Session persists (AsyncStorage)                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 1.3: Forgot Password (3 Steps)                         │  │
│  │  Step 1: Enter email → Send code                            │  │
│  │  Step 2: Enter OTP (123456) → Verify                        │  │
│  │  Step 3: New password → Reset → Login                       │  │
│  │  ✓ All 3 steps work                                         │  │
│  │  ✓ Can login with new password                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 1.4: Email Verification                                │  │
│  │  Profile → Verify Email → Send OTP → Verify                 │  │
│  │  ✓ Verified badge appears                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PASS CRITERIA: ✅ All 4 tests complete without crashes             │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: CORE RIDE BOOKING FLOW (30 minutes)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 2.1: Find Ride (Location Selection)                    │  │
│  │  Home → Book a Ride                                         │  │
│  │  From: "Thurston Gardens, Suva"                             │  │
│  │  To: "University of South Pacific"                          │  │
│  │  Find Now → Confirm Ride                                    │  │
│  │  ✓ Google Places autocomplete works                         │  │
│  │  ✓ Both locations required                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 2.2: Confirm Ride (Fare Estimate)                      │  │
│  │  Loading... (2-3 seconds)                                   │  │
│  │  Fare Breakdown:                                            │  │
│  │    - Base Fare: FJD 2.50                                    │  │
│  │    - Distance: FJD X.XX (6km)                               │  │
│  │    - Time: FJD X.XX (12 min)                                │  │
│  │    - Tax: FJD X.XX                                          │  │
│  │    - Total: FJD XX.XX                                       │  │
│  │  Request Ride → Book Ride                                   │  │
│  │  ✓ Estimate loads quickly                                   │  │
│  │  ✓ Math is correct                                          │  │
│  │  ✓ Geofence validation passes                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 2.3: Book Ride (CRITICAL - WebSocket Test)             │  │
│  │  "Requesting Ride..." → POST /ride/book                     │  │
│  │  "Finding Driver..." → autoAssignDriver() runs              │  │
│  │  WebSocket Event: ride:driver_assigned                      │  │
│  │  Driver Card Appears (< 10 seconds):                        │  │
│  │    - John Ravouvou                                          │  │
│  │    - Toyota Camry FJ1234                                    │  │
│  │    - Rating: 4.8 ⭐                                          │  │
│  │    - Phone: +6791234567                                     │  │
│  │  Status Updates: searching → accepted → arriving → ongoing  │  │
│  │  ✓ WebSocket connected (check backend logs)                │  │
│  │  ✓ Driver info renders correctly                            │  │
│  │  ✓ Real-time updates work                                   │  │
│  │                                                              │  │
│  │  ⚠️ IF DRIVER NOT ASSIGNED:                                 │  │
│  │     - Check backend logs for WebSocket auth errors          │  │
│  │     - Verify BUG-001 fix applied                            │  │
│  │     - Verify drivers are online in MongoDB                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Manual Simulation: Complete the Ride                        │  │
│  │  In MongoDB Compass:                                        │  │
│  │    db.rides.updateOne(                                      │  │
│  │      {status: 'searching'},                                 │  │
│  │      {$set: {status: 'completed', completedAt: new Date()}} │  │
│  │    )                                                         │  │
│  │  App auto-navigates → Trip Complete screen                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 2.4: Trip Complete (Receipt & Rating)                  │  │
│  │  View receipt:                                              │  │
│  │    - From/To addresses                                      │  │
│  │    - Distance: 6.0 km                                       │  │
│  │    - Duration: 12 min                                       │  │
│  │    - Fare breakdown                                         │  │
│  │  Rate driver: ⭐⭐⭐⭐⭐ (5 stars)                            │  │
│  │  Submit Rating → Success                                    │  │
│  │  "Book Another Ride" → Home                                 │  │
│  │  ✓ Rating submitted                                         │  │
│  │  ✓ State cleared                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PASS CRITERIA: ✅ Complete end-to-end ride flow works              │
│  CRITICAL CHECK: ✅ WebSocket driver assignment successful          │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 3: PROFILE & SAVED PLACES (20 minutes)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 3.1-3.3: Profile Management                            │  │
│  │  Profile tab → View info                                    │  │
│  │  Edit Profile → Change name/phone → Save                    │  │
│  │  Upload photo → Gallery → Crop (1:1) → Upload (Cloudinary)  │  │
│  │  ✓ Changes saved                                            │  │
│  │  ✓ Photo uploads                                            │  │
│  │  ✓ Account suggestions show progress                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 4.1-4.3: Saved Places                                  │  │
│  │  Profile → Saved Places                                     │  │
│  │  Add Home: "Thurston Gardens, Suva"                         │  │
│  │  Add Work: "USP Laucala Bay"                                │  │
│  │  ✓ Both appear on Home tab                                  │  │
│  │  Edit Home → Change address → Save                          │  │
│  │  Delete Work → Confirm → Removed                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 4.4: Quick Book from Saved Place                       │  │
│  │  Home tab → Tap "Home" card                                 │  │
│  │  Find Ride → To field pre-filled                            │  │
│  │  Enter From → Book ride (same flow as Phase 2)              │  │
│  │  ✓ Destination auto-populated                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PASS CRITERIA: ✅ Profile editable, photo uploads, places work     │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 4: RIDE HISTORY (15 minutes)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 5.1-5.2: View History                                  │  │
│  │  Rides tab → "Past" (default)                               │  │
│  │  Pull to refresh                                            │  │
│  │  View completed ride from Phase 2                           │  │
│  │  Tap "Upcoming" → Empty (no active rides)                   │  │
│  │  ✓ Ride appears with all details                            │  │
│  │  ✓ Sorted by date (newest first)                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 5.3-5.4: Rebook & Details                              │  │
│  │  Tap ride card → View details                               │  │
│  │  Tap "Rebook" → Find Ride (destination pre-filled)          │  │
│  │  ✓ Previous destination set                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PASS CRITERIA: ✅ History displays, rebook works                   │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 5: EDGE CASES & ERROR HANDLING (30 minutes)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 7.1: Geofence Validation                               │  │
│  │  Book ride: From Suva → To "Savusavu, Fiji" (out of area)   │  │
│  │  ✓ Error: "Destination outside service area"                │  │
│  │  ✓ Cannot proceed to booking                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 7.2: No Drivers Available                              │  │
│  │  In MongoDB: Set all drivers isOnline: false                │  │
│  │  Book valid ride                                            │  │
│  │  ✓ After 30 sec: "No Drivers Available"                     │  │
│  │  ✓ Options: "Try Again" or "Cancel"                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 7.3: Network Errors                                    │  │
│  │  Start booking → Turn off WiFi → Error banner               │  │
│  │  Turn on WiFi → Retry → Success                             │  │
│  │  ✓ Graceful error handling                                  │  │
│  │  ✓ No crashes                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                   ↓                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test 7.6: Account Deletion                                  │  │
│  │  Profile → Delete Account → Enter password → Confirm        │  │
│  │  ✓ Logout → Cannot login (account deleted)                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PASS CRITERIA: ✅ All errors handled gracefully                    │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6: UI/UX POLISH (15 minutes)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ☐ Dark mode (enable in Android settings)                           │
│  ☐ Haptic feedback on button presses                                │
│  ☐ Smooth animations (splash, transitions)                          │
│  ☐ Responsive design (rotate device)                                │
│  ☐ Loading states display correctly                                 │
│  ☐ Error messages clear and actionable                              │
│                                                                      │
│  PASS CRITERIA: ✅ App feels polished and professional              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  FINAL REPORT: Document Findings                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Total tests executed                                             │
│  ✓ Pass rate                                                        │
│  ✓ Critical bugs found                                              │
│  ✓ Performance observations                                         │
│  ✓ Recommendations                                                  │
│                                                                      │
│  Template: See "Test Results Template" in QUICK-START-CHECKLIST.md │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
  TESTING COMPLETE! 🎉
  
  Total Estimated Time: 2-3 hours (comprehensive)
                        30 minutes (quick validation)
  
  Files to Reference:
  - Full Plan: E2E-TESTING-GUIDE.md (26 pages)
  - Quick Start: QUICK-START-CHECKLIST.md
  - Bug Report: BUG-REPORT-E2E-TESTING.md
  - Test Data: mongodb-test-data-setup.js
═══════════════════════════════════════════════════════════════════════
```

---

## 🎯 Critical Success Checkpoints

### ✅ Checkpoint 1: Authentication Works
- User can signup with OTP `123456`
- User can login and session persists
- **If FAIL:** Check backend logs, verify OTP_MOCK_CODE set

### ✅ Checkpoint 2: WebSocket Connects (MOST IMPORTANT!)
- During ride booking, driver assignment works
- Backend logs show: `✅ Socket connected with user ID: [id]`
- **If FAIL:** BUG-001 not fixed, token key mismatch

### ✅ Checkpoint 3: Complete Ride Flow Works
- Fare estimate → Book → Driver assigned → Trip complete
- All 4 steps succeed without errors
- **If FAIL:** Check geofence, driver availability, WebSocket

### ✅ Checkpoint 4: No Crashes
- App navigable without crashes
- All forms submit successfully
- Errors shown with friendly messages

---

## 📊 Quick Status Dashboard

Use this during testing:

```
┌─────────────────────────────────────┐
│  TESTING STATUS DASHBOARD           │
├─────────────────────────────────────┤
│  Authentication:       ⏳ / ✅ / ❌  │
│  Ride Booking:         ⏳ / ✅ / ❌  │
│  WebSocket:            ⏳ / ✅ / ❌  │
│  Profile:              ⏳ / ✅ / ❌  │
│  Saved Places:         ⏳ / ✅ / ❌  │
│  History:              ⏳ / ✅ / ❌  │
│  Edge Cases:           ⏳ / ✅ / ❌  │
│  UI/UX:                ⏳ / ✅ / ❌  │
├─────────────────────────────────────┤
│  Critical Bugs Found:  [   ]        │
│  Minor Issues:         [   ]        │
│  Enhancements:         [   ]        │
└─────────────────────────────────────┘
```

---

**Last Updated:** February 14, 2026  
**Status:** ✅ READY FOR TESTING
