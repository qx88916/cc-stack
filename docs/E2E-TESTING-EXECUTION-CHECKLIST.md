# CabConnect Passenger App - E2E Testing Execution Checklist

## ✅ Pre-Testing Setup Complete!

### Environment Status
- ✅ Backend server running on `http://192.168.0.133:5000`
- ✅ MongoDB running on `localhost:27017`
- ✅ Expo dev server starting for passenger app
- ✅ Test drivers created (3 online, 1 offline)
- ✅ Environment variables configured

### Quick Start Guide
1. **Backend**: Already running in terminal (port 5000)
2. **Expo**: Run `npx expo start` in `cabconnect-passenger-app` directory
3. **Android Device**: Scan QR code with Expo Go app
4. **Backend URL**: `http://192.168.0.133:5000` (configured in app .env)

---

## 📱 Testing Device Setup

### Android Device Configuration
- ✅ Install Expo Go from Google Play Store
- ✅ Connect to same WiFi network as development machine
- ✅ Scan QR code from Expo terminal
- ✅ Allow location permissions when prompted
- ✅ Allow camera/gallery permissions for profile photo

---

## 🧪 Test Execution Checklist

### Test Suite 1: Authentication Flow ✓

#### ✅ 1.1 New User Signup with Email OTP

**Test Steps:**
1. [ ] Launch app → Welcome screen appears
2. [ ] Auto-redirects to Signup screen (after 2.5s)
3. [ ] Enter test details:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
4. [ ] Verify password strength indicator shows "Strong"
5. [ ] Tap "Sign Up"
6. [ ] OTP Modal appears
7. [ ] Enter `123456` (mock OTP)
8. [ ] Account created successfully
9. [ ] Auto-login and redirect to Home tab

**Validation Checkpoints:**
- [ ] Real-time email validation works
- [ ] Password strength indicator updates (Weak → Medium → Strong)
- [ ] Password mismatch shows error
- [ ] OTP input auto-focuses
- [ ] Backend calls succeed:
  - `POST /auth/send-email-otp` → 200
  - `POST /auth/verify-email-otp` → 200
  - `POST /auth/signup` → 201

**Edge Cases to Test:**
- [ ] Invalid email format → inline error
- [ ] Weak password → warning message
- [ ] Wrong OTP → error banner
- [ ] Duplicate email → "Email already exists" error

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 1.2 Email/Password Login

**Test Steps:**
1. [ ] Logout from current session (Profile → Logout)
2. [ ] Navigate to Login screen
3. [ ] Enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPassword123!`
4. [ ] Tap "Log In"
5. [ ] Redirect to Home tab
6. [ ] Close app completely
7. [ ] Reopen app
8. [ ] Should remain logged in (session persistence)

**Validation Checkpoints:**
- [ ] Email validation works real-time
- [ ] Password visibility toggle works
- [ ] "Remember me" option visible
- [ ] Error banner for invalid credentials
- [ ] Backend call: `POST /auth/login` → 200

**Edge Cases:**
- [ ] Invalid credentials → "Invalid credentials" error
- [ ] Deleted account → error message
- [ ] Session persists after app restart

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 1.3 Forgot Password Flow (3 Steps)

**Step 1: Request Reset**
1. [ ] From Login → tap "Forgot Password?"
2. [ ] Enter email: `testuser@example.com`
3. [ ] Tap "Send Reset Code"
4. [ ] Advances to Step 2

**Step 2: Verify OTP**
1. [ ] Enter OTP: `123456`
2. [ ] Tap "Verify Code"
3. [ ] Advances to Step 3

**Step 3: Set New Password**
1. [ ] Enter new password: `NewPassword123!`
2. [ ] Confirm password: `NewPassword123!`
3. [ ] Tap "Reset Password"
4. [ ] Redirects to Login with success message

**Final Validation:**
5. [ ] Login with NEW password
6. [ ] Should log in successfully

**Validation Checkpoints:**
- [ ] Back navigation works between steps
- [ ] OTP countdown timer visible
- [ ] Resend OTP works
- [ ] Password strength indicator in Step 3
- [ ] Backend calls:
  - `POST /auth/request-password-reset` → 200
  - `POST /auth/verify-password-reset` → 200
  - `POST /auth/reset-password` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 1.4 Email Verification (In-App)

**Setup:**
1. [ ] Create account WITHOUT verifying email (skip OTP or use unverified account)

**Test Steps:**
1. [ ] Login to unverified account
2. [ ] Navigate to Profile tab
3. [ ] See "Verify Email" prompt in account suggestions
4. [ ] Tap "Verify Email"
5. [ ] Email pre-filled in verification screen
6. [ ] Tap "Send Code"
7. [ ] Wait for OTP email (or use `123456`)
8. [ ] Enter OTP
9. [ ] Tap "Verify"
10. [ ] Success message appears
11. [ ] Navigate back to Profile
12. [ ] Verified badge appears next to email

**Validation Checkpoints:**
- [ ] Email address pre-filled
- [ ] Resend code works (60s cooldown)
- [ ] Benefits of verification displayed
- [ ] Verified badge shows in profile
- [ ] Backend calls:
  - `POST /auth/send-email-otp` → 200
  - `POST /auth/verify-email-otp` → 200
  - `POST /user/verify-email` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 2: Core Ride Booking Flow ✓

#### ✅ 2.1 Find Ride (Location Selection)

**Test Steps:**
1. [ ] From Home tab → tap "Book a Ride" (or FAB button)
2. [ ] Find Ride screen appears
3. [ ] **From Field:**
   - Tap and type: `Victoria Parade, Suva`
   - Google Places suggestions appear
   - Select location from dropdown
4. [ ] **To Field:**
   - Tap and type: `Ratu Sukuna Park, Suva`
   - Select destination from dropdown
5. [ ] Tap "Find Now"
6. [ ] Navigates to Confirm Ride screen

**Validation Checkpoints:**
- [ ] Google Places API returns suggestions
- [ ] Selected locations stored
- [ ] Location permission requested if denied
- [ ] Button disabled until both fields filled
- [ ] Banner prompt if location permission denied

**Test Locations (Within Geofence):**
- **Suva:**
  - Victoria Parade, Suva (-18.1416, 178.4419)
  - Ratu Sukuna Park, Suva (-18.1437, 178.4408)
- **Nadi:**
  - Nadi Airport (-17.7555, 177.4438)
  - Nadi Town (-17.7765, 177.4370)
- **Lautoka:**
  - Lautoka City (-17.6161, 177.4460)
  - Lautoka Hospital (-17.6094, 177.4508)

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 2.2 Confirm Ride (Fare Estimate)

**Test Steps:**
1. [ ] Confirm Ride screen loads
2. [ ] Shows pickup and dropoff addresses
3. [ ] Loading spinner appears
4. [ ] Fare breakdown displays within 2-3 seconds:
   - Base Fare: FJD 2.50
   - Distance Charge: FJD X.XX
   - Time Charge: FJD X.XX
   - Subtotal, Tax (15%), Total
5. [ ] Map shows route polyline
6. [ ] Distance and duration displayed
7. [ ] Tap "Request Ride"
8. [ ] Navigates to Book Ride screen

**Validation Checkpoints:**
- [ ] Estimate loads within 3 seconds
- [ ] Fare breakdown totals correct
- [ ] Geofence validation passes
- [ ] Distance and duration reasonable
- [ ] Backend call: `POST /ride/estimate` → 200

**Test Cases:**

**Valid Short Trip (< 5km):**
- Pickup: Victoria Parade, Suva
- Dropoff: Ratu Sukuna Park
- [ ] Estimate loads successfully
- [ ] Base fare + minimal distance/time charges

**Valid Long Trip (> 10km):**
- [ ] Fare calculated correctly
- [ ] Distance/time charges proportional

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 2.3 Book Ride & Driver Assignment

**Test Steps - Successful Assignment:**
1. [ ] Book Ride screen appears
2. [ ] Shows "Requesting Ride..." spinner
3. [ ] Status changes to "Finding Driver..."
4. [ ] Within 10 seconds, driver assigned
5. [ ] Driver card appears with:
   - [ ] Driver photo
   - [ ] Driver name (John Tuivaga, Maria Singh, or Seru Bale)
   - [ ] Vehicle details (Toyota Corolla, Honda Civic, or Nissan Tiida)
   - [ ] Plate number (FJ-1234, FJ-5678, or FJ-9012)
   - [ ] Driver phone number
   - [ ] Rating (4.8-5.0 stars)
6. [ ] Fare and trip details visible
7. [ ] "Cancel Ride" button available

**Real-Time Status Updates:**
8. [ ] Manually update ride status in MongoDB:
   - Change status to `accepted`
   - [ ] UI updates to show "Driver Accepted"
   - Change status to `arriving`
   - [ ] UI updates to show "Driver Arriving"
   - Change status to `ongoing`
   - [ ] UI updates to show "Trip In Progress"
   - Change status to `completed`
   - [ ] Navigates to Trip Complete screen

**Validation Checkpoints:**
- [ ] Idempotency-Key sent in header
- [ ] WebSocket connection stable
- [ ] Real-time updates work
- [ ] Driver info displays correctly
- [ ] Backend calls:
  - `POST /ride/book` → 201
  - WebSocket: `ride:driver_assigned`
  - WebSocket: `ride:update` (for status changes)

**How to Update Status Manually:**
```javascript
// Open MongoDB Compass or mongosh
// Find the ride document and update:
db.rides.updateOne(
  { _id: ObjectId('YOUR_RIDE_ID') },
  { $set: { status: 'accepted' } }
)
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 2.3b Cancel Ride - Before Assignment

**Test Steps:**
1. [ ] Book a new ride
2. [ ] During "Finding Driver..." phase
3. [ ] Tap "Cancel Ride"
4. [ ] Cancellation reason modal appears
5. [ ] Select reason: "Changed my mind"
6. [ ] Tap "Confirm"
7. [ ] Returns to Home tab
8. [ ] Confirmation message shown

**Validation:**
- [ ] Ride status set to `cancelled` in database
- [ ] No charges applied
- [ ] Backend call: `POST /ride/:id/cancel` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 2.3c Cancel Ride - After Assignment

**Test Steps:**
1. [ ] Book a ride
2. [ ] Wait for driver assignment
3. [ ] After driver assigned, tap "Cancel Ride"
4. [ ] Warning appears: "Driver has accepted. You may be charged."
5. [ ] Select cancellation reason
6. [ ] Confirm cancellation
7. [ ] Ride cancelled successfully

**Validation:**
- [ ] Warning message displayed
- [ ] Cancellation completed
- [ ] Backend: `POST /ride/:id/cancel` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 2.4 Trip Complete (Receipt & Rating)

**Test Steps:**
1. [ ] After ride status changed to `completed`
2. [ ] Trip Complete screen appears automatically
3. [ ] Screen displays:
   - [ ] Driver card (photo, name, vehicle, plate)
   - [ ] Trip summary (from/to addresses)
   - [ ] Distance traveled
   - [ ] Duration
   - [ ] Fare breakdown (base, distance, time, tax, total)
4. [ ] 5-star rating selector visible
5. [ ] Tap to select rating (e.g., 4 stars)
6. [ ] Tap "Submit Rating"
7. [ ] Success message appears
8. [ ] Tap "Book Another Ride"
9. [ ] Returns to Home tab
10. [ ] Previous ride state cleared

**Validation Checkpoints:**
- [ ] Ride details fetched: `GET /ride/:rideId` → 200
- [ ] Rating submitted: `POST /ride/:rideId/rate` → 200
- [ ] All trip details accurate
- [ ] Fare calculation correct
- [ ] Can navigate away without rating (optional)

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 3: Profile Management ✓

#### ✅ 3.1 View Profile

**Test Steps:**
1. [ ] Navigate to Profile tab
2. [ ] Verify displayed information:
   - [ ] Profile photo (default avatar if not uploaded)
   - [ ] Name
   - [ ] Email
   - [ ] Verified badge (if email verified)
   - [ ] Role: "Passenger"
   - [ ] Member since date

**Account Suggestions Section:**
3. [ ] If profile incomplete, check suggestions:
   - [ ] Upload profile photo
   - [ ] Verify email
   - [ ] Add home location
   - [ ] Add work location
4. [ ] Progress bar shows completion percentage

**Validation:**
- [ ] All session data displayed correctly
- [ ] Verified badge only if `emailVerified: true`
- [ ] Progress bar accurate

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 3.2 Edit Profile

**Test Steps:**
1. [ ] From Profile → tap "Edit Profile"
2. [ ] Screen shows pre-filled fields:
   - Name: (current name)
   - Phone: (current phone)
   - Email: (read-only)
3. [ ] Modify name to: `Test User Updated`
4. [ ] Modify phone to: `+6799999999`
5. [ ] Tap "Save Changes"
6. [ ] Success message appears
7. [ ] Navigate back to Profile
8. [ ] Changes reflected in profile

**Validation Checkpoints:**
- [ ] Email field read-only (info message shown)
- [ ] Name validation works (min 2 chars)
- [ ] Phone validation works
- [ ] Backend call: `PATCH /user/profile` → 200

**Test Cases:**
- [ ] Empty name → validation error
- [ ] Invalid phone format → error
- [ ] No changes → no API call made

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 3.3 Profile Photo Upload

**Test Steps:**
1. [ ] From Profile → tap camera icon on profile photo
2. [ ] Modal appears with options:
   - "Take Photo"
   - "Choose from Gallery"
3. [ ] Select "Choose from Gallery"
4. [ ] Permission requested (if not granted)
5. [ ] Select an image from gallery
6. [ ] Cropping UI appears (1:1 aspect ratio)
7. [ ] Adjust crop area
8. [ ] Tap "Crop" or "Confirm"
9. [ ] Upload progress indicator shows
10. [ ] Photo updates in profile
11. [ ] Refresh profile to confirm upload persisted

**Validation Checkpoints:**
- [ ] Gallery permission requested
- [ ] Cropping UI works (1:1 ratio)
- [ ] Upload progress visible
- [ ] Cloudinary upload successful
- [ ] Backend call: `PATCH /user/profile-photo` → 200
- [ ] Response includes Cloudinary URL

**Test Cases:**
- [ ] Valid image (< 5MB, JPEG/PNG) → success
- [ ] Cancel cropping → upload cancelled
- [ ] Permission denied → error message
- [ ] Image persists after app restart

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 4: Saved Places ✓

#### ✅ 4.1 View Saved Places

**Test Steps:**
1. [ ] From Profile → tap "Saved Places"
2. [ ] Screen shows:
   - [ ] Home card (if saved)
   - [ ] Work card (if saved)
   - [ ] "Add Home" button (if not saved)
   - [ ] "Add Work" button (if not saved)
3. [ ] Info box: "Benefits of saved places" visible

**Validation:**
- [ ] Places fetched: `GET /user/saved-places` → 200
- [ ] Empty state if no places saved
- [ ] Saved places display address

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 4.2 Add Home Location

**Test Steps:**
1. [ ] From Saved Places → tap "Add Home"
2. [ ] Google Places Autocomplete field appears
3. [ ] Type address: `123 Victoria Parade, Suva`
4. [ ] Suggestions appear
5. [ ] Select address from dropdown
6. [ ] Tap "Save Place"
7. [ ] Success message appears
8. [ ] Navigate back to Saved Places
9. [ ] Home card now displays with address

**Validation:**
- [ ] Type indicator pre-selected: "Home"
- [ ] Google Places returns suggestions
- [ ] Backend call: `POST /user/saved-places` → 200
- [ ] Place stored in `savedPlacesStore`

**Test Cases:**
- [ ] Valid place → saved successfully
- [ ] No selection → button disabled
- [ ] Update existing home → replaces (not duplicate)

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 4.3 Add Work Location

**Test Steps:**
1. [ ] From Saved Places → tap "Add Work"
2. [ ] Type address: `Ratu Sukuna Park, Suva`
3. [ ] Select from dropdown
4. [ ] Tap "Save Place"
5. [ ] Navigate back
6. [ ] Work card displays address

**Validation:**
- [ ] Saved successfully
- [ ] Backend: `POST /user/saved-places` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 4.4 Edit Saved Place

**Test Steps:**
1. [ ] From Saved Places → tap Home card
2. [ ] Navigates to Add Place screen (edit mode)
3. [ ] Current address pre-filled
4. [ ] Change address to new location
5. [ ] Tap "Save Place"
6. [ ] Navigate back
7. [ ] Home card shows updated address

**Validation:**
- [ ] Edit mode loads correctly
- [ ] Update successful: `POST /user/saved-places` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 4.5 Delete Saved Place

**Test Steps:**
1. [ ] From Saved Places → tap "Delete" on Home card
2. [ ] Confirmation modal appears
3. [ ] Tap "Confirm"
4. [ ] Home card removed
5. [ ] "Add Home" button appears

**Validation:**
- [ ] Deletion successful: `DELETE /user/saved-places/home` → 200
- [ ] Card removed from UI

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 4.6 Quick Book from Home Tab

**Test Steps:**
1. [ ] Ensure Work location is saved
2. [ ] Navigate to Home tab
3. [ ] Saved places section shows Home and Work cards
4. [ ] Tap "Work" card
5. [ ] Navigates to Find Ride screen
6. [ ] **To** field pre-filled with Work address
7. [ ] **From** field empty (for manual entry)
8. [ ] Enter pickup location
9. [ ] Tap "Find Now"
10. [ ] Continue booking flow

**Validation:**
- [ ] Destination pre-populated correctly
- [ ] Coordinates carried through
- [ ] Booking flow identical to manual entry

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 5: Ride History ✓

#### ✅ 5.1 View Past Rides

**Test Steps:**
1. [ ] Navigate to Rides tab
2. [ ] Default to "Past" tab
3. [ ] Pull-to-refresh
4. [ ] List displays completed/cancelled rides
5. [ ] Each card shows:
   - [ ] Date and time
   - [ ] From → To addresses
   - [ ] Fare amount
   - [ ] Status badge (Completed/Cancelled)
   - [ ] Driver name

**Validation:**
- [ ] Rides sorted by date (newest first)
- [ ] Backend call: `GET /history` → 200
- [ ] Empty state if no past rides
- [ ] Pull-to-refresh works

**Test Cases:**
- [ ] No rides → empty state with illustration
- [ ] 1 ride → single card displayed
- [ ] Multiple rides → scrollable list

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 5.2 View Upcoming Rides

**Test Steps:**
1. [ ] Tap "Upcoming" tab
2. [ ] List displays active rides (searching, accepted, arriving, ongoing)
3. [ ] Empty if no active rides

**Validation:**
- [ ] Tab indicator animates smoothly
- [ ] Different empty state for upcoming vs past
- [ ] Active ride displays if exists

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 5.3 Rebook Previous Ride

**Test Steps:**
1. [ ] From Past rides → tap a ride card
2. [ ] Ride details appear
3. [ ] Tap "Rebook" button
4. [ ] Navigates to Find Ride screen
5. [ ] **To** field pre-filled with previous destination
6. [ ] Enter pickup location
7. [ ] Complete booking flow

**Validation:**
- [ ] Destination coordinates correct
- [ ] New ride independent of previous
- [ ] Booking succeeds

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 5.4 View Ride Details

**Test Steps:**
1. [ ] From Past rides → tap a ride card
2. [ ] Navigates to Trip Complete screen
3. [ ] Full ride details displayed
4. [ ] Rating already submitted (cannot re-rate)

**Validation:**
- [ ] Historical data fetched: `GET /ride/:id` → 200
- [ ] All details accurate
- [ ] No re-rating allowed

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 6: Real-Time Features (WebSocket) ✓

#### ✅ 6.1 WebSocket Connection

**Test Steps:**
1. [ ] Login to app
2. [ ] Check backend terminal logs
3. [ ] Look for: "WebSocket connected: [user id]"
4. [ ] Verify token authentication
5. [ ] Background app
6. [ ] Foreground app
7. [ ] Connection should persist

**Validation:**
- [ ] Socket connects on app launch
- [ ] JWT token sent correctly
- [ ] Connection survives backgrounding
- [ ] Backend logs show connection

**⚠️ Known Issue to Check:**
- SocketContext may use wrong AsyncStorage key
- Check if `AsyncStorage.getItem('token')` should be `@auth/token`

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 6.2 Driver Assignment Events

**Test Steps:**
1. [ ] Book a ride
2. [ ] Monitor backend logs for `autoAssignDriver()` execution
3. [ ] Within 10 seconds, WebSocket should emit:
   - `ride:driver_assigned` (if driver found)
   - `ride:no_drivers` (if no drivers)
4. [ ] App UI updates immediately

**Validation:**
- [ ] Event received within 10 seconds
- [ ] Driver data complete in event payload
- [ ] UI updates with driver info

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 6.3 Ride Status Updates

**Test Steps:**
1. [ ] After driver assigned
2. [ ] Manually update ride status in MongoDB:
   ```javascript
   // searching → accepted
   db.rides.updateOne(
     { _id: ObjectId('RIDE_ID') },
     { $set: { status: 'accepted' } }
   )
   ```
3. [ ] WebSocket emits `ride:update`
4. [ ] App UI reflects new status
5. [ ] Repeat for: `arriving`, `ongoing`, `completed`

**Validation:**
- [ ] Status badge updates
- [ ] UI text changes per status
- [ ] Events received in real-time

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 7: Edge Cases & Error Handling ✓

#### ✅ 7.1 Geofence Validation - Pickup Outside Service Area

**Test Steps:**
1. [ ] Navigate to Find Ride
2. [ ] Enter pickup OUTSIDE Suva/Nadi/Lautoka
   - Example: `Auckland, New Zealand`
   - Or: `Sydney, Australia`
3. [ ] Enter valid destination (Suva)
4. [ ] Tap "Find Now"
5. [ ] On Confirm Ride screen → error appears
6. [ ] Error message: "Pickup outside service area"
7. [ ] Shows nearest area
8. [ ] Cannot proceed to booking

**Validation:**
- [ ] Error message clear
- [ ] Backend: `POST /ride/estimate` → 400
- [ ] Suggests nearest service area
- [ ] Booking blocked

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 7.2 Geofence Validation - Destination Outside Service Area

**Test Steps:**
1. [ ] Enter valid pickup (Suva)
2. [ ] Enter destination OUTSIDE geofence
3. [ ] Tap "Find Now"
4. [ ] Error on Confirm Ride screen

**Validation:**
- [ ] Error: "Destination outside service area"
- [ ] Cannot proceed

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 7.3 No Drivers Available

**Setup:**
```javascript
// Set all drivers offline in MongoDB
db.drivers.updateMany({}, { $set: { isOnline: false } })
```

**Test Steps:**
1. [ ] Book a ride in Suva
2. [ ] Wait 30 seconds (3 assignment attempts)
3. [ ] Screen shows "No Drivers Available"
4. [ ] Options: "Try Again" or "Cancel"
5. [ ] Tap "Try Again"
6. [ ] Re-attempts assignment

**Cleanup:**
```javascript
// Set drivers back online
db.drivers.updateMany({}, { $set: { isOnline: true } })
```

**Validation:**
- [ ] WebSocket event: `ride:no_drivers`
- [ ] UI shows friendly message
- [ ] Try Again triggers new attempt
- [ ] Cancel returns to Home

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 7.4 Network Errors

**Test with Airplane Mode:**

**A) Login with Network Error**
1. [ ] Logout from app
2. [ ] Enable Airplane mode
3. [ ] Attempt login
4. [ ] Should show: "Network error. Check connection."
5. [ ] Disable Airplane mode
6. [ ] Retry → succeeds

**B) Booking with Network Error**
1. [ ] Start booking process
2. [ ] On Confirm Ride screen, enable Airplane mode
3. [ ] Tap "Request Ride"
4. [ ] Error shown with retry option
5. [ ] Disable Airplane mode
6. [ ] Retry → succeeds

**Validation:**
- [ ] No app crashes
- [ ] User-friendly error messages
- [ ] Retry mechanism works

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 7.5 Duplicate Booking Prevention (Idempotency)

**Test Steps:**
1. [ ] Book a ride (normal flow)
2. [ ] Note the `Idempotency-Key` header in network logs
3. [ ] Before driver assigned, use API tool (Postman/curl) to send:
   ```bash
   POST http://192.168.0.133:5000/ride/book
   Headers:
     Authorization: Bearer YOUR_TOKEN
     Idempotency-Key: SAME_KEY_FROM_STEP_2
   Body: (same as original request)
   ```
4. [ ] Backend should return EXISTING ride (not create duplicate)

**Validation:**
- [ ] Only 1 ride created in database
- [ ] Second request returns same ride
- [ ] No duplicate charges

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 7.6 Session Expiry

**Setup:**
```javascript
// In MongoDB, expire the token or wait 7 days
// Or modify JWT_SECRET in backend .env temporarily
```

**Test Steps:**
1. [ ] Login to app
2. [ ] Force session expiry (change JWT_SECRET or wait)
3. [ ] Navigate to Profile or Book Ride
4. [ ] Should show error: "Session expired"
5. [ ] Auto-redirect to Login

**Validation:**
- [ ] 401 response handled
- [ ] User prompted to re-login
- [ ] Can login again successfully

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 7.7 Account Deletion

**Test Steps:**
1. [ ] From Profile → tap "Delete Account"
2. [ ] Confirmation modal appears
3. [ ] Password field shown
4. [ ] Enter password
5. [ ] Tap "Delete Account"
6. [ ] Final warning appears
7. [ ] Confirm deletion
8. [ ] Account soft-deleted (`isDeleted: true`)
9. [ ] Should logout and redirect to Welcome screen
10. [ ] Attempt to login with deleted account
11. [ ] Error: "Account not found" or similar

**Validation:**
- [ ] Password required
- [ ] Soft delete (data retained in DB)
- [ ] Cannot login after deletion
- [ ] Backend: `DELETE /user/account` → 200

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

### Test Suite 8: UI/UX & Performance ✓

#### ✅ 8.1 Dark Mode

**Test Steps:**
1. [ ] Enable dark mode in Android system settings
2. [ ] Open app
3. [ ] Check all screens for readability:
   - [ ] Home tab
   - [ ] Profile tab
   - [ ] Rides tab
   - [ ] Find Ride screen
   - [ ] Confirm Ride screen
   - [ ] Book Ride screen

**Validation:**
- [ ] Text readable in dark mode
- [ ] Theme colors from `constants/theme.ts` applied
- [ ] No white backgrounds blinding users

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 8.2 Animations

**Test Scenarios:**
1. [ ] Welcome screen fade-out (2.5s)
2. [ ] Tab indicator slide on Rides tab (Past ↔ Upcoming)
3. [ ] Splash screen animation (bolt icon fade + scale)
4. [ ] Pull-to-refresh animation

**Validation:**
- [ ] Smooth 60fps animations
- [ ] No janky transitions
- [ ] Animations complete properly

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 8.3 Haptic Feedback

**Test Scenarios:**
1. [ ] Tap "Request Ride" button → haptic feedback
2. [ ] Tap "Sign Up" button → haptic feedback
3. [ ] Profile photo upload → haptic feedback
4. [ ] Star rating selection → haptic feedback

**Validation:**
- [ ] Haptics on critical actions

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

#### ✅ 8.4 Performance & Responsiveness

**Test Scenarios:**
1. [ ] Rotate device → layouts adapt
2. [ ] Fast scrolling in Ride History → smooth
3. [ ] Quick tab switches → no lag
4. [ ] API calls → response times reasonable (< 3s)

**Validation:**
- [ ] UI responsive
- [ ] No memory leaks
- [ ] No crashes during testing

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Passed | ❌ Failed

**Notes/Bugs:**
```
[Write any issues found here]
```

---

## 🐛 Bug Report Template

### Bug #1
**Title:** [Concise bug description]

**Severity:** Critical | High | Medium | Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Logs:**
```
[Paste relevant logs or attach screenshots]
```

**Environment:**
- Device: Android [version]
- App Version: 1.0.0
- Backend: Running locally

**Notes:**


---

## 📊 Testing Summary Report

### Overall Progress
- **Total Test Cases:** ~85
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___
- **Not Tested:** ___

### Critical Issues Found
1. 
2. 
3. 

### Recommendations
1. 
2. 
3. 

### Performance Notes
- **Average API Response Time:** ___ ms
- **Driver Assignment Time:** ___ seconds
- **Memory Usage:** Acceptable | High
- **Battery Drain:** Normal | Elevated

### Next Steps
1. 
2. 
3. 

---

## 🔧 Useful MongoDB Queries for Testing

### View All Users
```javascript
db.users.find().pretty()
```

### View All Drivers
```javascript
db.drivers.find().pretty()
```

### View All Rides
```javascript
db.rides.find().sort({ createdAt: -1 }).pretty()
```

### Set All Drivers Online
```javascript
db.drivers.updateMany({}, { $set: { isOnline: true } })
```

### Set All Drivers Offline
```javascript
db.drivers.updateMany({}, { $set: { isOnline: false } })
```

### Update Ride Status
```javascript
db.rides.updateOne(
  { _id: ObjectId('RIDE_ID_HERE') },
  { $set: { status: 'completed' } }
)
```

### Clear All Test Data
```javascript
db.users.deleteMany({ email: { $regex: '@cabconnect.test$' } })
db.drivers.deleteMany({})
db.rides.deleteMany({})
```

### Reset Test Drivers
```bash
# Run setup script again
node setup-test-drivers.js
```

---

## 📞 Test Support

### Backend Logs
Monitor in real-time:
```bash
# Backend terminal shows all API calls and WebSocket events
```

### Network Debugging
Use React Native Debugger or:
- Chrome DevTools (shake device → Debug)
- Network tab to see API calls
- Console tab for errors

### MongoDB Monitoring
Use MongoDB Compass:
- Connection: `mongodb://127.0.0.1:27017`
- Database: `ridehailing`
- Collections: `users`, `drivers`, `rides`

---

## ✅ Testing Complete!

Once all test suites are passed:
1. Fill out Bug Report for any issues found
2. Complete Testing Summary Report
3. Document performance observations
4. Share findings with team

**Happy Testing! 🚀**
