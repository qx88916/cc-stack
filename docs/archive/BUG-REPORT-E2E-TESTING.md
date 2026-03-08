# CabConnect E2E Testing - Bug Report & Known Issues

**Date Generated:** February 14, 2026  
**Testing Phase:** Pre-Testing Analysis  
**Environment:** Local Development

---

## 🔴 CRITICAL BUGS (Must Fix Before Testing)

### BUG-001: WebSocket Token Key Mismatch
**Severity:** CRITICAL 🔴  
**Status:** Confirmed  
**Impact:** WebSocket connection will FAIL for all users, blocking real-time features

**Description:**
The SocketContext and AuthContext use different AsyncStorage keys for the JWT token, causing WebSocket authentication to fail.

**Root Cause:**
- **AuthContext** stores token at key: `@auth/token` (line 4)
- **SocketContext** retrieves token from key: `token` (line 37)
- Result: SocketContext gets `null`, connection fails

**Files Affected:**
- `cabconnect-passenger-app/contexts/SocketContext.tsx` (line 37)
- `cabconnect-passenger-app/contexts/AuthContext.tsx` (line 4)

**Code Evidence:**
```typescript
// AuthContext.tsx (line 4)
const TOKEN_KEY = "@auth/token";

// SocketContext.tsx (line 37)
const token = await AsyncStorage.getItem('token'); // ❌ Wrong key!
```

**Expected Behavior:**
- User logs in → Socket connects with JWT → Real-time updates work

**Actual Behavior:**
- User logs in → Socket connection fails (no token found) → No real-time updates

**Test to Reproduce:**
1. Login to the app successfully
2. Check backend logs for WebSocket connection
3. Expected: `✅ Socket connected: [socket-id]`
4. Actual: `❌ Socket authentication failed` or no connection

**Fix Required:**
```typescript
// SocketContext.tsx (line 37)
// Change from:
const token = await AsyncStorage.getItem('token');

// To:
const TOKEN_KEY = '@auth/token'; // Match AuthContext
const token = await AsyncStorage.getItem(TOKEN_KEY);
```

**Testing After Fix:**
1. Login to app
2. Monitor backend logs
3. Should see: `✅ Socket connected with user ID: [user-id]`
4. Book a ride → Driver assignment should work via WebSocket

---

### BUG-002: Email Suggestion Function Missing
**Severity:** HIGH 🟠  
**Status:** Confirmed  
**Impact:** App will CRASH during signup if user types misspelled email

**Description:**
The signup screen imports and calls `suggestEmailDomain()` function, but this function is not defined anywhere, causing a runtime error.

**Root Cause:**
- `signup.tsx` imports `suggestEmailDomain` from `utils/emailHelper.ts`
- Function is used to suggest corrections (e.g., gmial → gmail)
- But function is NOT implemented in the utils file

**Files Affected:**
- `cabconnect-passenger-app/app/(auth)/signup.tsx` (imports function)
- `cabconnect-passenger-app/utils/emailHelper.ts` (function missing)

**Expected Behavior:**
- User types "test@gmial.com"
- UI shows suggestion: "Did you mean gmail.com?"

**Actual Behavior:**
- User types "test@gmial.com"
- App crashes: `ReferenceError: suggestEmailDomain is not defined`

**Test to Reproduce:**
1. Go to Signup screen
2. Enter email: "test@gmial.com" (misspelled)
3. Expected: Suggestion appears
4. Actual: App crashes or error banner

**Fix Required:**
Either implement the function or remove the feature:

**Option A: Implement the function**
```typescript
// utils/emailHelper.ts
export function suggestEmailDomain(email: string): string | null {
  const commonTypos = {
    'gmial': 'gmail',
    'gmai': 'gmail',
    'gamil': 'gmail',
    'yahooo': 'yahoo',
    'yaho': 'yahoo',
    'outlok': 'outlook',
    'hotmial': 'hotmail',
  };
  
  const match = email.match(/@(.+)\.com$/);
  if (!match) return null;
  
  const domain = match[1];
  return commonTypos[domain] ? commonTypos[domain] + '.com' : null;
}
```

**Option B: Remove the feature**
```typescript
// signup.tsx
// Remove import and usage of suggestEmailDomain
```

**Testing After Fix:**
1. Type "test@gmial.com" in signup
2. Should see suggestion (or no crash if feature removed)

---

## 🟡 MEDIUM PRIORITY ISSUES

### ISSUE-001: Geofence Boundary Edge Cases
**Severity:** MEDIUM 🟡  
**Status:** Suspected  
**Impact:** Some valid locations near boundaries may be incorrectly rejected

**Description:**
Coordinates near the edge of geofence polygons (Suva, Nadi, Lautoka) may fail validation inconsistently.

**Root Cause (Suspected):**
- Point-in-polygon algorithm may have precision issues
- Boundary coordinates may be slightly off

**Files Affected:**
- `cabconnect-backend-main/src/config/geofence.ts`
- `cabconnect-backend-main/src/routes/ride.ts` (estimate endpoint)

**Test Scenario:**
1. Use coordinates exactly on geofence boundary
2. Test multiple times
3. Check if validation is consistent

**Example Coordinates to Test:**
- Edge of Suva geofence: (-18.1800, 178.4900)
- Edge of Nadi geofence: (-17.8100, 177.5000)

**Expected:** Consistent validation (always pass or always fail)  
**Actual:** May be inconsistent

**Fix Required:**
- Review geofence polygon coordinates
- Add buffer zone (e.g., 100m inside boundary)
- Improve validation algorithm

---

### ISSUE-002: Backend CORS Origins Limited
**Severity:** MEDIUM 🟡  
**Status:** Confirmed  
**Impact:** App may not connect if using different local IP

**Description:**
Backend `.env` has `ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006` which doesn't include network IP addresses.

**Current Configuration:**
```env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

**Problem:**
- Passenger app uses `http://192.168.0.133:5000`
- This IP is not in ALLOWED_ORIGINS
- May cause CORS errors

**Fix Required:**
```env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://192.168.0.133:8081,http://192.168.0.133:19006
```

Or use wildcard in development:
```env
ALLOWED_ORIGINS=*
```

**Testing After Fix:**
1. Make API call from app
2. Check browser/network logs
3. Should not see CORS errors

---

## 🟢 LOW PRIORITY / ENHANCEMENTS

### ENHANCEMENT-001: No Redis Configured
**Severity:** LOW 🟢  
**Status:** By Design  
**Impact:** Using in-memory storage for OTPs and idempotency

**Description:**
Backend logs show: `⚠️ REDIS_URL not set. Using in-memory storage (NOT recommended for production)`

**Current Behavior:**
- OTPs stored in memory
- Idempotency keys stored in memory
- Works fine for local development
- Data lost on server restart

**Recommendation:**
- ✅ OK for local testing
- ❌ Not suitable for production
- Install Redis for staging/production

**No Action Required for Testing**

---

### ENHANCEMENT-002: Google Maps API Key in Backend
**Severity:** LOW 🟢  
**Status:** Optional  
**Impact:** Backend geocoding not used (frontend handles it)

**Description:**
Backend has `GOOGLE_MAPS_API_KEY` configured but may not be actively used.

**Current Usage:**
- Fare estimate uses Google Directions API
- Likely called from backend
- Frontend has its own Places API key

**Recommendation:**
- Verify if backend uses this key
- If not, can be removed

**No Action Required for Testing**

---

## 📋 Pre-Testing Checklist

Before starting E2E tests, ensure these are addressed:

### Critical (Must Fix)
- [ ] **BUG-001:** Fix SocketContext token key mismatch
- [ ] **BUG-002:** Implement or remove `suggestEmailDomain` function

### High Priority (Should Fix)
- [ ] Verify CORS origins include network IP
- [ ] Test geofence boundary coordinates

### Optional (Can Test As-Is)
- [ ] Redis not configured (acceptable for local testing)
- [ ] Review Google Maps API usage

---

## 🧪 Testing Strategy

### Phase 1: Without Fixes (Document Issues)
1. Test authentication (should work)
2. Test ride booking (WebSocket will fail)
3. Document all observed issues
4. Create detailed bug reports

### Phase 2: With Critical Fixes Applied
1. Retest ride booking (WebSocket should work)
2. Retest signup (email suggestion should work or not crash)
3. Complete full E2E test suite

---

## 📊 Bug Priority Matrix

| Bug ID | Severity | Impact | Blocks Testing? | Fix Complexity |
|--------|----------|--------|----------------|---------------|
| BUG-001 | CRITICAL | Real-time features broken | Partially | Easy (1 line) |
| BUG-002 | HIGH | Signup may crash | Partially | Easy (implement or remove) |
| ISSUE-001 | MEDIUM | Edge locations may fail | No | Medium (review polygon) |
| ISSUE-002 | MEDIUM | CORS errors possible | No | Easy (update .env) |

---

## 🔧 Quick Fixes Script

Apply these fixes before testing:

```bash
# Fix 1: Socket Token Key
# Edit: cabconnect-passenger-app/contexts/SocketContext.tsx
# Line 37: Change 'token' to '@auth/token'

# Fix 2: CORS Origins
# Edit: cabconnect-backend-main/.env
# Add: ,http://192.168.0.133:8081,http://192.168.0.133:19006

# Fix 3: Email Suggestion (Option: Remove)
# Edit: cabconnect-passenger-app/app/(auth)/signup.tsx
# Remove import and usage of suggestEmailDomain
```

---

## 📞 Support Information

**Backend Logs Location:** Terminal where `npm run dev` is running  
**App Logs Location:** Expo Dev Tools or device logs  
**MongoDB Connection:** `mongodb://127.0.0.1:27017/ridehailing`

**Test Support:**
- Mock OTP: `123456`
- Test Driver Credentials: `driver1@test.com` / `Driver123!`
- Test Passenger Credentials: `passenger1@test.com` / `Pass1234!`

---

**Last Updated:** February 14, 2026  
**Next Review:** After fixing critical bugs
