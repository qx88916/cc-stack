# CabConnect — Micro-Phases Reference

> Development roadmap with specific file paths, changes, dependencies, and acceptance criteria.
> **Last updated:** March 7, 2026 — Phase A + Phase B fully completed

---

## Current Completion

| App | Status | Notes |
|-----|--------|-------|
| Backend API | ~98% | All endpoints complete, reject endpoint implemented, push service added |
| Passenger App | ~95% | Phase A complete (A1–A8 criteria met) |
| Driver App | ~95% | Phase B complete (B1–B10 criteria met) |
| Admin Panel | ~55% | Login + dashboard + users done, settings buggy, rides/drivers missing |

---

## Development Order

```
Phase A (Passenger + Backend) ──> Phase B (Driver + Backend) ──> Phase C (Admin + Backend)

A1 ─> A2 ─> A3 ─> A4 ─> A5 ─> A6 ─> A7 ─> A8
                                                 \
B1 ─> B2 ─> B3 ─> B4 ─> B5 ─> B6 ─> B7 ─> B8 ─> B9 ─> B10
                                                           \
C1 ─> C2 ─> C3 ─> C4 ─> C5 ─> C6 ─> C7 ─> C8 ─> C9
```

---

## Rules (Apply to EVERY Micro-Phase)

1. Read the relevant `.cursor/rules/*.mdc` BEFORE making changes
2. No mock data, no static data, no hardcoded values — use real backend APIs
3. Zero TypeScript errors (`tsc --noEmit` must pass)
4. Proper error handling with user-facing messages on every API call
5. Loading states on every async operation
6. Do NOT modify `tsconfig.json`, `next.config.js`, `app.json` without asking
7. Do NOT create new files unless necessary — edit existing files
8. Fix the root cause, not the symptom
9. Test that changes don't break existing working functionality
10. One micro-phase at a time — complete it fully before moving to next

---

## PHASE A — Passenger App + Backend

### A1: Fix Backend Bugs

**Goal:** Fix 3 known backend bugs that break core functionality.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/backend/src/services/matching.ts` | `findNearestDriver` returns `driver.userId` instead of `driver._id` — ride assignment uses wrong ID. Fix to return `driver._id`. |
| `apps/backend/src/config/fare.ts` | Reads fare config from env vars only, ignores `Settings` model in DB. Refactor to read from `Settings.getSettings()` first, fall back to env vars. |
| `apps/backend/src/routes/auth.ts` | Remove `console.log` in signup route (security: leaks user data to stdout). |

**Dependencies:** None (start here).

**Acceptance criteria:**
- [x] `matching.ts`: `findNearestDriver` returns `driver._id` (the Driver document ID), not `driver.userId`
- [x] `fare.ts`: `calculateFare` reads baseFare/perKmRate/perMinuteRate/surgeMultiplier/taxRate from `Settings` model first, env vars as fallback
- [x] `auth.ts`: Zero `console.log` statements in production code paths
- [x] All existing tests still pass
- [x] Backend starts without errors

---

### A2: Replace Home Screen Mock Data with Real API

**Goal:** Home screen shows real recent rides from the backend instead of static mock data.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/passenger/app/(root)/(tabs)/home.tsx` | Replace `mockRides` import with API call to `GET /history` (or `GET /ride/history`). Add loading/error states. |
| `apps/passenger/constants/mock-rides.ts` | Remove this file after home.tsx no longer imports it (or leave if other files use it — check first). |

**Dependencies:** A1 (backend bugs fixed).

**Acceptance criteria:**
- [x] Home screen fetches rides from `GET /history` endpoint on mount
- [x] Loading spinner shown while fetching
- [x] Empty state shown when no rides exist
- [x] Error state shown on network failure with retry option
- [x] No imports from `mock-rides.ts` remain in production code

---

### A3: Integrate Maps Properly

**Goal:** Replace hardcoded/placeholder maps with real coordinate-based maps.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/passenger/components/StaticMap.tsx` | Remove hardcoded Suva coordinates. Use pickup/dropoff coordinates from `locationStore` or props. |
| `apps/passenger/components/RideLayout.tsx` | Replace placeholder content with actual map integration (MapNative or StaticMap with real coords). |
| `apps/passenger/components/MapNative.tsx` | Wire to `locationStore` for current location, show pickup/dropoff markers from ride data. |
| `apps/passenger/store/locationStore.ts` | Verify store exposes pickup/dropoff coordinates correctly for map components. |
| `apps/passenger/lib/map.ts` | Verify map utility functions work with real coordinates. |

**Dependencies:** A1, A2.

**Acceptance criteria:**
- [x] `StaticMap` renders with actual pickup/dropoff coordinates (not hardcoded Suva)
- [x] `RideLayout` shows a real map with route between pickup and dropoff
- [x] `MapNative` displays user's current location and relevant markers
- [x] Maps work on both iOS and Android
- [x] Geoapify/Google Maps API keys loaded from env vars

---

### A4: Payment Integration

**Goal:** Implement payment selection UI (cash-based for Fiji market, with placeholder for future M-PAiSA/Stripe).

**Files to modify:**

| File | Change |
|------|--------|
| `apps/passenger/components/Payment.tsx` | Replace stub with working payment method selector. Default to "Cash" for Fiji. Show fare breakdown. |
| `apps/passenger/app/(root)/book-ride.tsx` | Wire Payment component into booking flow. Pass fare data from ride estimate. |
| `apps/passenger/app/(root)/confirm-ride.tsx` | Show selected payment method in ride confirmation. |
| `apps/passenger/app/(root)/trip-complete.tsx` | Show final fare and payment method on trip complete screen. |

**Dependencies:** A1, A3.

**Acceptance criteria:**
- [x] Payment component shows "Cash" as default payment method
- [x] Fare breakdown displayed (base + distance + time + tax)
- [x] Payment method persisted through booking flow (find → confirm → book → complete)
- [x] No hardcoded fare values — all from API estimate response
- [x] Placeholder UI for future digital payment methods (non-functional, clearly marked)

---

### A5: Socket.IO Hardening

**Goal:** Make real-time communication robust with reconnection, offline handling, and consistent URL config.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/passenger/contexts/SocketContext.tsx` | Add reconnection logic (exponential backoff), offline detection, connection state exposed to UI. |
| `apps/passenger/contexts/AuthContext.tsx` | Align socket URL with auth API base URL (use same config source). |
| `apps/passenger/src/config.ts` | Ensure socket URL and API URL are configured from same source (env var or constants). |
| `apps/passenger/app/(root)/book-ride.tsx` | Handle socket disconnection during active ride (show reconnecting banner, queue events). |
| `apps/passenger/store/rideStore.ts` | Handle ride state recovery after socket reconnection (re-fetch active ride status). |

**Dependencies:** A1, A4.

**Acceptance criteria:**
- [x] Socket auto-reconnects on disconnect (with exponential backoff)
- [x] UI shows "Reconnecting..." banner when socket is disconnected
- [x] Ride state recovers correctly after reconnection
- [x] Socket URL and API URL come from same config source
- [x] App handles airplane mode gracefully (no crashes, shows offline state)
- [x] Socket authenticated with JWT token from AuthContext

---

### A6: Remove Dead Code

**Goal:** Clean up unused files, stubs, and imports from the passenger app.

**Files to remove/modify:**

| File | Change |
|------|--------|
| `apps/passenger/app/(auth)/signup_new.tsx` | Delete this file (unused duplicate of signup.tsx). |
| `apps/passenger/components/OAuth.tsx` | Remove or stub with "Coming Soon" if referenced in UI. Remove non-functional Google/Apple OAuth code. |
| `apps/passenger/constants/mock-rides.ts` | Delete if no longer imported anywhere (should be gone after A2). |
| All files in `apps/passenger/` | Audit for unused imports and remove them. |

**Dependencies:** A2 (mock-rides removal depends on A2 completion).

**Acceptance criteria:**
- [x] `signup_new.tsx` deleted
- [x] No dead OAuth code executing (either removed or clearly marked as "Coming Soon")
- [x] `mock-rides.ts` deleted (if unused)
- [x] Zero unused import warnings
- [x] App builds and runs without errors after cleanup

---

### A7: Error Boundaries + Loading/Error States Audit

**Goal:** Every screen and async operation has proper loading, error, and empty states.

**Files to audit/modify:**

| File | Change |
|------|--------|
| `apps/passenger/app/(root)/(tabs)/home.tsx` | Verify loading/error/empty states |
| `apps/passenger/app/(root)/(tabs)/rides.tsx` | Verify loading/error/empty states |
| `apps/passenger/app/(root)/(tabs)/profile.tsx` | Verify loading/error/empty states |
| `apps/passenger/app/(root)/find-ride.tsx` | Verify loading/error states for location search |
| `apps/passenger/app/(root)/confirm-ride.tsx` | Verify loading/error states for fare estimate |
| `apps/passenger/app/(root)/book-ride.tsx` | Verify loading/error states for booking + socket |
| `apps/passenger/app/(root)/edit-profile.tsx` | Verify loading/error states for profile update |
| `apps/passenger/app/(root)/saved-places.tsx` | Verify loading/error/empty states |
| `apps/passenger/app/(root)/verify-email.tsx` | Verify loading/error states for OTP |
| `apps/passenger/app/_layout.tsx` | Add top-level error boundary wrapping the app |

**Dependencies:** A1 through A6 (audit after all features are wired).

**Acceptance criteria:**
- [x] Every screen shows a loading spinner/skeleton during data fetch
- [x] Every screen shows a user-friendly error message on API failure (with retry)
- [x] Every list screen shows an empty state when no data exists
- [x] Top-level error boundary catches unhandled errors and shows fallback UI
- [x] No screen shows a blank white page during loading or error

---

### A8: End-to-End Passenger Flow Test

**Goal:** Verify the full passenger journey works from signup to ride completion.

**Test flow:**

```
Signup → Login → Home (real rides) → Find Ride → Confirm Ride →
Book Ride → Driver Assigned (socket) → Ride In Progress →
Trip Complete → View in History → Edit Profile → Logout
```

**Dependencies:** A1 through A7 (all passenger phases complete).

**Acceptance criteria:**
- [x] New user can sign up with email + OTP verification
- [x] User can log in and see home screen with real data
- [x] User can search for a ride (pickup/dropoff via Google Places)
- [x] Fare estimate displayed correctly (from backend, not hardcoded)
- [x] User can confirm and book a ride
- [x] Socket connects and receives driver assignment events
- [x] Trip complete screen shows correct fare and payment method
- [x] Completed ride appears in ride history
- [x] Profile edit works (name, photo)
- [x] Logout clears session and redirects to login
- [x] Zero TypeScript errors: `tsc --noEmit` passes
- [x] No console errors in Metro bundler

---

## PHASE B — Driver App + Backend

### B1: Fix Signup Role + Driver Registration Flow

**Goal:** Fix hardcoded "passenger" role in driver signup and add vehicle info collection.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(auth)/signup.tsx` | Change hardcoded `"passenger"` role to `"driver"` in signup API call. Add vehicle info fields (make, model, year, plate number, color). |
| `apps/backend/src/routes/auth.ts` | Verify signup accepts and stores vehicle info for driver role. |
| `apps/backend/src/models/Driver.ts` | Verify schema includes vehicle fields (make, model, year, plateNumber, color). Add if missing. |
| `apps/driver/contexts/AuthContext.tsx` | Verify auth context handles driver role correctly. |

**Dependencies:** A1 (backend bugs fixed).

**Acceptance criteria:**
- [x] Driver signup sends `role: "driver"` (not "passenger")
- [x] Vehicle info (make, model, year, plate, color) collected during signup
- [x] Driver document created in DB with vehicle details
- [x] Driver can log in after signup and reach home screen
- [x] Input validation on all vehicle info fields

---

### B2: Wire Home Screen to Backend

**Goal:** Driver home screen shows real online/offline status from backend.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(root)/(tabs)/home.tsx` | Replace static UI with real `GET /driver/availability` call. Wire toggle to `PATCH /driver/availability`. Show earnings/stats from backend. |
| `apps/driver/contexts/AuthContext.tsx` | Ensure driver token is available for API calls. |
| `apps/driver/lib/fetch.ts` | Verify fetch utility sends auth headers correctly. |

**Dependencies:** B1.

**Acceptance criteria:**
- [x] Home screen fetches current availability status on mount
- [x] Online/offline toggle calls `PATCH /driver/availability` and updates backend
- [x] Toggle state persists across app restarts (reflects backend state)
- [x] Loading state shown during toggle
- [x] Error handling with toast/alert on failure

---

### B3: Implement Incoming Ride Request Flow

**Goal:** Driver receives ride requests via Socket.IO and can accept them.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(root)/(tabs)/home.tsx` | Listen for `ride:request` socket event. Show incoming ride modal with pickup/dropoff/fare. Accept button triggers `POST /driver/ride/:id/accept`. |
| `apps/driver/contexts/AuthContext.tsx` | Add Socket.IO connection (similar to passenger SocketContext). |
| `apps/backend/src/services/matching.ts` | Verify `ride:request` event is emitted to correct driver room. |
| `apps/backend/src/routes/driver.ts` | Verify `POST /driver/ride/:id/accept` works correctly. |

**New files (if needed):**

| File | Purpose |
|------|---------|
| `apps/driver/contexts/SocketContext.tsx` | Socket.IO context for driver app (if not reusing AuthContext for socket). |

**Dependencies:** B2.

**Acceptance criteria:**
- [x] Driver receives `ride:request` event when online and a passenger books nearby
- [x] Incoming ride modal shows pickup address, dropoff address, estimated fare, distance
- [x] Accept button calls `POST /driver/ride/:id/accept` and closes modal
- [x] Passenger receives `ride:driver_assigned` event after driver accepts
- [x] Timeout: if driver doesn't respond within 30s, request moves to next driver
- [x] Sound/vibration notification on incoming ride

---

### B4: Wire Active Ride Screen

**Goal:** Driver can navigate pickup, start trip, and complete trip with real API calls.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(root)/(tabs)/home.tsx` | After accepting ride, show active ride UI (pickup navigation → arrived → start trip → in progress → complete). |
| `apps/backend/src/routes/driver.ts` | Verify `PATCH /driver/ride/:id/status` handles all transitions: `driver_assigned → arrived → in_progress → completed`. |
| `apps/driver/components/MapNative.tsx` | Show route to pickup, then route to dropoff during trip. |
| `apps/driver/components/RideLayout.tsx` | Display active ride info (passenger name, pickup/dropoff, fare). |

**Dependencies:** B3.

**Acceptance criteria:**
- [x] After accepting: shows navigation to pickup point
- [x] "Arrived" button updates ride status and notifies passenger
- [x] "Start Trip" button transitions ride to in_progress
- [x] "Complete Trip" button transitions ride to completed and shows fare summary
- [x] Each status update calls `PATCH /driver/ride/:id/status` on backend
- [x] Passenger app receives real-time status updates via socket

---

### B5: Implement POST /driver/ride/:id/reject Backend Logic

**Goal:** Complete the stub endpoint so drivers can reject ride requests.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/backend/src/routes/driver.ts` | Implement `POST /driver/ride/:id/reject`: validate ride exists and is assigned to this driver, update ride status, trigger re-matching to find next nearest driver. |
| `apps/backend/src/services/matching.ts` | Add logic to exclude rejected driver and re-run `findNearestDriver`. Track rejected drivers per ride. |
| `apps/backend/src/models/Ride.ts` | Add `rejectedDrivers` array field to ride schema (if not already present). |

**Dependencies:** B3.

**Acceptance criteria:**
- [x] `POST /driver/ride/:id/reject` returns 200 and updates ride state
- [x] Rejected driver is excluded from future matching for this ride
- [x] System automatically tries next nearest driver after rejection
- [x] If no more drivers available, passenger receives `ride:no_drivers` event
- [x] Driver who rejected returns to available state
- [x] Input validation: only assigned driver can reject

---

### B6: Wire Ride History to GET /driver/history

**Goal:** Driver rides tab shows real completed rides from backend.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(root)/(tabs)/rides.tsx` | Replace static data with `GET /driver/history` API call. Add loading/error/empty states. |
| `apps/driver/components/RideCard.tsx` | Verify component renders real ride data (pickup, dropoff, fare, date, status). |
| `apps/driver/components/RideCardCopy.tsx` | Remove if duplicate of RideCard.tsx (dead code). |

**Dependencies:** B4 (needs completed rides to show in history).

**Acceptance criteria:**
- [x] Rides tab fetches from `GET /driver/history` on mount
- [x] Each ride shows: date, pickup/dropoff, fare earned, status
- [x] Pull-to-refresh supported
- [x] Loading spinner during fetch
- [x] Empty state when no ride history
- [x] Error state with retry on network failure

---

### B7: Wire Profile to Real User Data

**Goal:** Driver profile screen shows real data and supports editing.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(root)/(tabs)/profile.tsx` | Replace hardcoded fields with data from `GET /user/profile`. Add edit functionality via `PATCH /user/profile`. |
| `apps/driver/contexts/AuthContext.tsx` | Ensure user profile data (name, email, phone, vehicle info) is available from context or fetched on profile mount. |

**Dependencies:** B1 (driver profile fields must exist).

**Acceptance criteria:**
- [x] Profile shows real name, email, phone, profile photo from backend
- [x] Vehicle info displayed (make, model, year, plate, color)
- [x] User can edit name, phone, vehicle info
- [x] Profile photo upload works
- [x] Loading state while fetching profile
- [x] Success toast on profile update

---

### B8: Location Tracking (Background Updates)

**Goal:** Driver location is continuously sent to backend during active rides.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/(root)/(tabs)/home.tsx` | Start background location tracking when driver goes online. Stop when offline. |
| `apps/backend/src/routes/driver.ts` | Verify `PATCH /driver/location` or equivalent endpoint updates driver's `lastLocation` in DB. |
| `apps/backend/src/models/Driver.ts` | Verify `lastLocation` field with GeoJSON format and 2dsphere index. |

**New files (if needed):**

| File | Purpose |
|------|---------|
| `apps/driver/services/locationTracking.ts` | Background location tracking service using `expo-location` TaskManager. |

**Dependencies:** B4.

**Acceptance criteria:**
- [x] Driver location updates sent every 10-15 seconds when online
- [x] Background location tracking works when app is backgrounded
- [x] Location updates stop when driver goes offline
- [x] Backend stores latest driver location with timestamp
- [x] Passenger can see driver location updates during active ride (via socket)
- [x] Battery-efficient: uses significant location change mode, not continuous GPS

---

### B9: Push Notifications for Incoming Rides

**Goal:** Driver receives push notification when a new ride request arrives.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/driver/app/_layout.tsx` | Register for push notifications on app start. Send push token to backend. |
| `apps/backend/src/services/matching.ts` | Send push notification to driver when emitting `ride:request` (in addition to socket). |
| `apps/backend/src/models/Driver.ts` | Add `pushToken` field to driver schema. |

**New files (if needed):**

| File | Purpose |
|------|---------|
| `apps/backend/src/services/push.ts` | Push notification service (Expo Push API). |

**Dependencies:** B3, B8.

**Acceptance criteria:**
- [x] Driver receives push notification for new ride requests
- [x] Notification shows pickup area and estimated fare
- [x] Tapping notification opens the app to the ride request screen
- [x] Push token stored in backend and refreshed on app start
- [x] Works when app is backgrounded or closed
- [x] Notification not sent if driver is offline

---

### B10: End-to-End Driver Flow Test

**Goal:** Verify the full driver journey works from signup to ride completion.

**Test flow:**

```
Signup (with vehicle info) → Login → Go Online → Receive Ride Request →
Accept Ride → Navigate to Pickup → Arrive → Start Trip →
Complete Trip → View in History → Edit Profile → Go Offline → Logout
```

**Dependencies:** B1 through B9 (all driver phases complete).

**Acceptance criteria:**
- [x] New driver can sign up with vehicle info
- [x] Driver can log in and see home screen with real status
- [x] Online/offline toggle works and persists
- [x] Incoming ride request appears when passenger books nearby
- [x] Driver can accept/reject rides
- [x] Full ride lifecycle works: accept → arrive → start → complete
- [x] Completed ride appears in history with correct fare
- [x] Profile shows real data and is editable
- [x] Location tracking works in background
- [x] Push notifications received when app is backgrounded
- [x] Zero TypeScript errors: `tsc --noEmit` passes

---

## PHASE C — Admin Panel + Backend

### C1: Fix Settings Form (Radix Select Boolean Values)

**Goal:** Fix the bug where `enabled` and `maintenanceMode` Select components always submit as `false`.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/admin/app/dashboard/settings/page.tsx` | Fix Radix Select for `enabled` (line ~251) and `maintenanceMode` (line ~337). The Select `value` must be controlled state, not just `defaultValue`. Convert string "true"/"false" to actual booleans before submitting to API. |
| `apps/admin/components/ui/select.tsx` | Verify the Radix Select wrapper forwards `onValueChange` correctly. |

**Dependencies:** None (can start Phase C independently if Phase A/B are blocked).

**Acceptance criteria:**
- [ ] Geofence `enabled` toggle submits correct boolean value (true/false)
- [ ] General `maintenanceMode` toggle submits correct boolean value
- [ ] Settings persist after save and page refresh
- [ ] Toast notification on successful save
- [ ] Backend `Settings` model updated correctly (verify in DB)

---

### C2: Add Rides Management Page (Frontend)

**Goal:** Admin can view and filter all rides in the system.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/admin/components/layout/sidebar.tsx` | Add "Rides" nav link to sidebar. |

**New files:**

| File | Purpose |
|------|---------|
| `apps/admin/app/dashboard/rides/page.tsx` | Rides management page: table with columns (ID, passenger, driver, status, fare, date), filters (status, date range), pagination, click to view detail. |

**Dependencies:** C3 (needs backend endpoint).

**Acceptance criteria:**
- [ ] Rides page accessible from sidebar navigation
- [ ] Table shows all rides with: ID, passenger name, driver name, status, fare, pickup, dropoff, date
- [ ] Filter by status (requested, assigned, in_progress, completed, cancelled)
- [ ] Filter by date range
- [ ] Search by passenger or driver name
- [ ] Pagination (20 rides per page)
- [ ] Click on ride to see full details (modal or detail view)
- [ ] Loading/error/empty states

---

### C3: Add Backend Endpoint — GET /admin/rides

**Goal:** Provide paginated, filterable ride data for admin panel.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/backend/src/routes/admin.ts` | Add `GET /admin/rides` endpoint: paginated, filterable by status/date/search term. Populate passenger and driver names. Return total count for pagination. |
| `apps/backend/src/models/Ride.ts` | Verify ride schema has indexes on `status`, `createdAt` for efficient queries. |

**Dependencies:** A1 (backend bugs fixed).

**Acceptance criteria:**
- [ ] `GET /admin/rides` returns paginated rides with populated passenger/driver info
- [ ] Query params: `page`, `limit`, `status`, `startDate`, `endDate`, `search`
- [ ] Response includes `total`, `page`, `limit`, `rides[]`
- [ ] Protected by admin auth middleware
- [ ] Efficient query with proper indexes
- [ ] Returns 200 with empty array when no rides match filters

---

### C4: Add Drivers Management Page (Frontend)

**Goal:** Admin can view, approve, and suspend drivers.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/admin/components/layout/sidebar.tsx` | Add "Drivers" nav link to sidebar (if not added in C2). |

**New files:**

| File | Purpose |
|------|---------|
| `apps/admin/app/dashboard/drivers/page.tsx` | Drivers management page: table (name, email, vehicle, status, rating, rides count), approve/suspend actions, filter by status. |

**Dependencies:** C5 (needs backend endpoints).

**Acceptance criteria:**
- [ ] Drivers page accessible from sidebar navigation
- [ ] Table shows: name, email, phone, vehicle info, online status, total rides, rating
- [ ] Filter by status (active, suspended, pending approval)
- [ ] Search by name, email, plate number
- [ ] Approve pending driver (confirmation modal)
- [ ] Suspend/unsuspend driver (with reason field, confirmation modal)
- [ ] View driver details (profile, vehicle, ride history)
- [ ] Pagination
- [ ] Loading/error/empty states

---

### C5: Add Backend Endpoints for Driver Management

**Goal:** Provide driver listing and management endpoints for admin.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/backend/src/routes/admin.ts` | Add `GET /admin/drivers` (paginated, filterable) and `PATCH /admin/drivers/:id` (approve, suspend, update). |
| `apps/backend/src/models/Driver.ts` | Add `status` field (active/suspended/pending) if not present. Add `suspendedReason` field. |

**Dependencies:** A1 (backend bugs fixed).

**Acceptance criteria:**
- [ ] `GET /admin/drivers` returns paginated drivers with user info and vehicle details
- [ ] Query params: `page`, `limit`, `status`, `search`
- [ ] `PATCH /admin/drivers/:id` supports: `{ status: "active" | "suspended", suspendedReason?: string }`
- [ ] Protected by admin auth middleware
- [ ] Suspended drivers cannot go online or accept rides
- [ ] Returns proper error codes (404 for not found, 400 for invalid status)

---

### C6: Add User Detail Page

**Goal:** Admin can view and edit individual user profiles and see their ride history.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/admin/app/dashboard/users/page.tsx` | Add click handler on user row to navigate to detail page. |

**New files:**

| File | Purpose |
|------|---------|
| `apps/admin/app/dashboard/users/[id]/page.tsx` | User detail page: profile info, edit fields, role change dropdown, ride history, account actions (verify, suspend, delete). |

**Dependencies:** C2, C3 (needs ride data for user's ride history).

**Acceptance criteria:**
- [ ] Click on user in users table navigates to `/dashboard/users/[id]`
- [ ] Shows full profile: name, email, phone, role, created date, verified status, photo
- [ ] Edit name, email, phone, role (with confirmation modal for role change)
- [ ] Ride history section showing user's rides (uses existing ride data)
- [ ] Account actions: verify email, suspend, restore, delete (with confirmation modals)
- [ ] Loading/error states
- [ ] Back button to return to users list

---

### C7: Dashboard Enhancements (Charts + Real-time)

**Goal:** Add visual charts and auto-refreshing data to the admin dashboard.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/admin/app/dashboard/page.tsx` | Add Recharts charts: rides over time (line chart), revenue over time (bar chart), ride status breakdown (pie chart). Add auto-refresh with TanStack Query `refetchInterval`. |

**New dependencies:**

| Package | Purpose |
|---------|---------|
| `recharts` | Chart library for React |

**Dependencies:** C3 (needs ride data endpoints for chart data).

**Acceptance criteria:**
- [ ] Line chart: rides per day/week/month (selectable range)
- [ ] Bar chart: revenue per day/week/month
- [ ] Pie chart: ride status distribution (completed, cancelled, in_progress)
- [ ] Charts use real data from backend
- [ ] Dashboard auto-refreshes every 30 seconds
- [ ] Responsive: charts resize on mobile/tablet
- [ ] Loading skeletons for charts during fetch

---

### C8: Export Data to CSV

**Goal:** Admin can export users, drivers, and rides data as CSV files.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/admin/app/dashboard/users/page.tsx` | Add "Export CSV" button that downloads current filtered user list as CSV. |
| `apps/admin/app/dashboard/rides/page.tsx` | Add "Export CSV" button for rides. |
| `apps/admin/app/dashboard/drivers/page.tsx` | Add "Export CSV" button for drivers. |

**New files (if needed):**

| File | Purpose |
|------|---------|
| `apps/admin/lib/csv.ts` | CSV generation utility (convert JSON array to CSV string, trigger download). |

**Dependencies:** C2, C4, C6 (pages must exist first).

**Acceptance criteria:**
- [ ] Export button on users, rides, and drivers pages
- [ ] CSV includes all visible table columns
- [ ] Respects current filters (exports filtered data, not all data)
- [ ] File named with entity type and date: `rides-2026-03-07.csv`
- [ ] Handles large datasets (pagination/streaming if > 1000 rows)
- [ ] Loading state on export button during generation

---

### C9: End-to-End Admin Flow Test

**Goal:** Verify all admin panel functionality works correctly.

**Test flow:**

```
Login → Dashboard (stats + charts) → Users (list, search, filter, view detail, edit) →
Drivers (list, approve, suspend) → Rides (list, filter, view detail) →
Settings (update fare, geofence, general) → Export CSV → Logout
```

**Dependencies:** C1 through C8 (all admin phases complete).

**Acceptance criteria:**
- [ ] Admin can log in with admin credentials
- [ ] Dashboard shows correct stats and charts with real data
- [ ] Users: list, search, filter, view detail, edit profile, change role, delete/restore
- [ ] Drivers: list, approve pending, suspend/unsuspend, view details
- [ ] Rides: list, filter by status/date, search, view details
- [ ] Settings: fare/geofence/general save correctly (including boolean fields)
- [ ] CSV export works for all three entities
- [ ] Sidebar navigation works for all pages
- [ ] Auth guard redirects to login when token expires
- [ ] Responsive layout works on tablet and desktop
- [ ] Zero TypeScript errors: `tsc --noEmit` passes
- [ ] No console errors in browser

---

## Quick Reference — File Paths

### Backend (`apps/backend/src/`)

| Area | Path |
|------|------|
| Entry point | `index.ts` |
| Socket.IO | `realtime.ts` |
| Auth routes | `routes/auth.ts` |
| Ride routes | `routes/ride.ts` |
| Driver routes | `routes/driver.ts` |
| Admin routes | `routes/admin.ts` |
| User routes | `routes/user.ts` |
| History routes | `routes/history.ts` |
| Driver matching | `services/matching.ts` |
| Fare config | `config/fare.ts` |
| Geofence config | `config/geofence.ts` |
| Redis client | `services/redis.ts` |
| Maps service | `services/maps.ts` |
| User model | `models/User.ts` |
| Driver model | `models/Driver.ts` |
| Ride model | `models/Ride.ts` |
| Settings model | `models/Settings.ts` |
| Auth middleware | `middleware/auth.ts` |

### Passenger App (`apps/passenger/`)

| Area | Path |
|------|------|
| Home screen | `app/(root)/(tabs)/home.tsx` |
| Rides history | `app/(root)/(tabs)/rides.tsx` |
| Profile | `app/(root)/(tabs)/profile.tsx` |
| Find ride | `app/(root)/find-ride.tsx` |
| Confirm ride | `app/(root)/confirm-ride.tsx` |
| Book ride | `app/(root)/book-ride.tsx` |
| Trip complete | `app/(root)/trip-complete.tsx` |
| Edit profile | `app/(root)/edit-profile.tsx` |
| Saved places | `app/(root)/saved-places.tsx` |
| Login | `app/(auth)/login.tsx` |
| Signup | `app/(auth)/signup.tsx` |
| Signup (dead) | `app/(auth)/signup_new.tsx` |
| Forgot password | `app/(auth)/forgot-password.tsx` |
| StaticMap | `components/StaticMap.tsx` |
| MapNative | `components/MapNative.tsx` |
| RideLayout | `components/RideLayout.tsx` |
| Payment | `components/Payment.tsx` |
| OAuth | `components/OAuth.tsx` |
| AuthContext | `contexts/AuthContext.tsx` |
| SocketContext | `contexts/SocketContext.tsx` |
| Location store | `store/locationStore.ts` |
| Ride store | `store/rideStore.ts` |
| Config | `src/config.ts` |
| Mock rides | `constants/mock-rides.ts` |

### Driver App (`apps/driver/`)

| Area | Path |
|------|------|
| Home screen | `app/(root)/(tabs)/home.tsx` |
| Rides history | `app/(root)/(tabs)/rides.tsx` |
| Profile | `app/(root)/(tabs)/profile.tsx` |
| Find ride | `app/(root)/find-ride.tsx` |
| Book ride | `app/(root)/book-ride.tsx` |
| Confirm ride | `app/(root)/confirm-ride.tsx` |
| Signup | `app/(auth)/signup.tsx` |
| Login | `app/(auth)/login.tsx` |
| MapNative | `components/MapNative.tsx` |
| Map | `components/Map.tsx` |
| RideLayout | `components/RideLayout.tsx` |
| Payment | `components/Payment.tsx` |
| OAuth | `components/OAuth.tsx` |
| RideCard | `components/RideCard.tsx` |
| RideCardCopy | `components/RideCardCopy.tsx` |
| AuthContext | `contexts/AuthContext.tsx` |
| Config | `src/config.ts` |
| Mock rides | `MockRides.js` |

### Admin Panel (`apps/admin/`)

| Area | Path |
|------|------|
| Dashboard | `app/dashboard/page.tsx` |
| Settings | `app/dashboard/settings/page.tsx` |
| Users | `app/dashboard/users/page.tsx` |
| Login | `app/login/page.tsx` |
| Root layout | `app/layout.tsx` |
| Dashboard layout | `app/dashboard/layout.tsx` |
| Sidebar | `components/layout/sidebar.tsx` |
| Navbar | `components/layout/navbar.tsx` |
| API client | `lib/api.ts` |
| Types | `types/index.ts` |
| Auth guard | `components/auth-guard.tsx` |
| Providers | `components/providers.tsx` |
| Select (Radix) | `components/ui/select.tsx` |
