# Phone Login Implementation — Phase 1.1 Complete

## Summary

Added phone number signup/login to the passenger app with **ONE-TIME SMS verification** (cost-saving approach). Users verify phone once during signup, then login with phone + password (no OTP every time).

**SMS Provider:** Console-only for now (dev/test). Ready to add Vonage/AWS SNS/MSG91 in ~10 lines when ready.

---

## What Was Implemented

### Backend (3 changes)

1. **`apps/backend/src/models/User.ts`**
   - Added `phoneVerified` field (Boolean, default: false)

2. **`apps/backend/src/routes/auth.ts`**
   - Updated `POST /auth/verify-otp` to accept `password` during signup
   - Sets `phoneVerified: true` when creating new user with password
   - Added `POST /auth/login-phone` endpoint (phone + password, no OTP)

### Frontend (4 new files + 3 updates)

**New Screens:**
1. **`apps/passenger/app/(auth)/phone-signup.tsx`**
   - 3-step wizard: Phone → Password → OTP verification
   - Fiji phone validation (+679, 7 digits, starts with 6/7/8/9)
   - Password strength indicator
   - Resend OTP with 60s cooldown

2. **`apps/passenger/app/(auth)/phone-login.tsx`**
   - Simple 2-field form: Phone + Password
   - No OTP, no SMS cost
   - "Use Email Instead" fallback link

**Updated Files:**
3. **`apps/passenger/contexts/AuthContext.tsx`**
   - Added `loginWithPhone(phone, password)` function
   - Calls new `POST /auth/login-phone` endpoint

4. **`apps/passenger/app/(auth)/login.tsx`**
   - Added "Login with Phone Number" button with OR divider

5. **`apps/passenger/app/(auth)/signup.tsx`**
   - Added "Sign Up with Phone Number" button with OR divider

---

## User Flow

### Signup (One-Time SMS)

```
Phone Signup Screen
  ↓ user enters 7-digit number
Step 1: +679 9123456
  ↓ tap "Next"
Step 2: Create password (strength indicator)
  ↓ tap "Next" → sends OTP (console-logged in dev)
Step 3: Enter 6-digit OTP
  ↓ verify → account created with phoneVerified=true
Redirect to Login
```

### Login (No SMS Cost)

```
Phone Login Screen
  ↓ user enters phone + password
+679 9123456
••••••••
  ↓ tap "Login" → backend verifies password
Logged In (no OTP, no SMS)
```

---

## Email vs Phone

**Both options are fully independent:**

- **Email primary** (existing, unchanged):
  - Signup: Email + Password → Email OTP verification
  - Login: Email + Password

- **Phone secondary** (new):
  - Signup: Phone + Password → SMS OTP verification (one-time)
  - Login: Phone + Password (no OTP)

Users choose their preferred method at signup/login.

---

## Cost Savings

**Before:** Every login → send OTP SMS → verify
- 100 users × 10 logins/month = 1,000 SMS

**After:** Signup once → send OTP SMS → verify phone → future logins use password
- 100 users = 100 SMS total (one-time)

**90-99% SMS cost reduction**

---

## SMS Provider (Future)

Currently OTP is console-logged (same as email OTP). To add real SMS:

**Option 1: Vonage (recommended)**
```bash
npm install @vonage/server-sdk
```

**Option 2: AWS SNS**
```bash
npm install @aws-sdk/client-sns
```

**Option 3: MSG91**
```bash
npm install msg91-sdk
```

Add 10 lines to `apps/backend/src/services/otp.ts` — code is provider-agnostic.

---

## Testing

### Dev Testing (Console OTP)
1. Open `phone-signup` → enter `9123456`
2. Create password → tap "Next"
3. Backend console shows: `[OTP] 9123456 -> 123456`
4. Enter `123456` in app → account created
5. Open `phone-login` → enter `9123456` + password → logged in

### Production (with SMS provider)
1. Add Vonage/AWS credentials to `.env`
2. User receives real SMS with OTP
3. Everything else works the same

---

## Files Changed

**Backend:**
- `apps/backend/src/models/User.ts` (added `phoneVerified`)
- `apps/backend/src/routes/auth.ts` (updated `/verify-otp`, added `/login-phone`)

**Frontend:**
- `apps/passenger/contexts/AuthContext.tsx` (added `loginWithPhone`)
- `apps/passenger/app/(auth)/phone-signup.tsx` (new)
- `apps/passenger/app/(auth)/phone-login.tsx` (new)
- `apps/passenger/app/(auth)/login.tsx` (added phone button)
- `apps/passenger/app/(auth)/signup.tsx` (added phone button)

---

## Zero TypeScript Errors

✅ All files pass `tsc --noEmit`
✅ No linter warnings
✅ Phone validation enforces Fiji format
✅ Password strength indicator
✅ OTP resend cooldown

---

## Next Steps (Optional)

1. **Add SMS provider** — Vonage/AWS SNS (~10 lines in `otp.ts`)
2. **Link accounts** — Allow users to link email + phone in settings (Phase 2)
3. **Forgot password for phone** — Add OTP-based password reset for phone users (Phase 2)
4. **Social login** — Google/Apple as tertiary option (Phase 2)
