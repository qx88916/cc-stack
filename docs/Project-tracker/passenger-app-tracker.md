# Passenger App — Feature Tracker

Last updated: Phase 1.1 complete (phone login/signup added)

---

## Phase 1.1 Status

| Feature                                           | Status  | File(s)                                                        |
| ------------------------------------------------- | ------- | -------------------------------------------------------------- |
| Register with email + OTP verification            | ✅ DONE | `app/(auth)/signup.tsx`, `app/(root)/verify-email.tsx`         |
| Register with phone + OTP verification (NEW)      | ✅ DONE | `app/(auth)/phone-signup.tsx`                                  |
| Login with email + password                       | ✅ DONE | `app/(auth)/login.tsx`                                         |
| Login with phone + password (NEW)                 | ✅ DONE | `app/(auth)/phone-login.tsx`                                   |
| Forgot password (email → OTP → new password)      | ✅ DONE | `app/(auth)/forgot-password.tsx`                               |
| Book ride now                                     | ✅ DONE | `app/(root)/book-ride.tsx`                                     |
| See fare estimate (full breakdown)                | ✅ DONE | `app/(root)/confirm-ride.tsx`                                  |
| Track driver location in real-time on map         | ✅ DONE | `components/MapNative.tsx`, `app/(root)/book-ride.tsx`         |
| Pay for ride — Cash only                          | ✅ DONE | `components/Payment.tsx` (M-PAiSA removed for Phase 1)         |
| Rate driver (1–5 stars)                           | ✅ DONE | `app/(root)/trip-complete.tsx`                                 |
| View ride history (past + upcoming tabs)          | ✅ DONE | `app/(root)/(tabs)/rides.tsx`                                  |
| Save favourite locations (Home / Work)            | ✅ DONE | `app/(root)/saved-places.tsx`, `app/(root)/add-place.tsx`      |
| Cancel ride (passenger + driver-cancel handled)   | ✅ DONE | `app/(root)/book-ride.tsx`                                     |
| Manage profile (name, email, photo)               | ✅ DONE | `app/(root)/edit-profile.tsx`, `app/(root)/(tabs)/profile.tsx` |
| Google Maps + route display                       | ✅ DONE | `components/MapNative.tsx`, `lib/map.ts`                       |
| OTP verification                                  | ✅ DONE | `app/(auth)/signup.tsx`, `app/(root)/verify-email.tsx`         |
| Pricing model (base fare + per km + per min)      | ✅ DONE | Backend `settings` + `app/(root)/confirm-ride.tsx`             |
| find-ride.tsx validation (pickup + dropoff guard) | ✅ DONE | `app/(root)/find-ride.tsx`                                     |
| paymentMethod: "cash" sent to backend             | ✅ DONE | `app/(root)/book-ride.tsx`                                     |
| Push notifications — backend triggers             | ✅ DONE | `apps/backend/src/routes/driver.ts`, `User` model              |

**Phase 1.1: 20/20 — COMPLETE** (added 2 phone auth features)

---

## Phase 2 Backlog (Do NOT build until Phase 1 ships)


| Feature                                     | Notes                                      |
| ------------------------------------------- | ------------------------------------------ |
| Find nearby drivers on map (before booking) | Show available drivers on home map         |
| Call / message driver (in-app)              | In-app calling + chat screen               |
| Schedule ride for later                     | Date/time picker for future bookings       |
| Multiple stops in one trip                  | Add waypoints to booking flow              |
| Book ride for someone else                  | Enter another person's details             |
| Share ride details with contacts            | Share ETA + driver info via SMS/WhatsApp   |
| Split payment with friends                  | Divide fare across multiple passengers     |
| Tip driver                                  | Post-trip tip flow                         |
| Download invoice / receipt (PDF)            | Generate and export receipt                |
| Social Media Login (Google / Apple)         | OAuth login options                        |
| View driver ratings / reviews               | See driver's rating history before booking |
| Online payments (M-PAiSA / card)            | Digital payment methods                    |
| WhatsApp notifications                      | Ride status updates via WhatsApp           |
| Emergency / Panic button                    | Safety feature — client deferred           |
| Share ride details via social media         | Share trip publicly                        |


---

## Infrastructure Added (Not client-requested, no user-facing changes)

| What                                                    | Why                                      |
| ------------------------------------------------------- | ---------------------------------------- |
| Retry with exponential backoff on API calls             | Prevents silent failures on bad network  |
| Offline banner                                          | UX — user knows why app isn't responding |
| App icon + splash screen PNGs                           | Required for EAS / App Store builds      |
| Deep link handler (`cabconnect://ride/ID`)              | Required for push notification taps      |
| Zero TypeScript errors (`tsc --noEmit` passes)          | Code quality                             |
| ESLint `no-any` + `no-console` rules                    | Code quality                             |
| `@cabconnect/shared` package alias                      | Type consistency across monorepo         |
| Cursor rules glob fix                                   | Internal tooling only                    |
| Phone authentication (NEW)                              | Cost-saving: one SMS per user (signup)   |
| `/auth/login-phone` endpoint (NEW)                      | Password-based login (no OTP cost)       |
| `phoneVerified` field in User model (NEW)               | Track phone verification status          |
| Phone number validation (Fiji +679 format) (NEW)        | Ensures valid local mobile numbers       |

---

## Phone Authentication Details (Phase 1.1)

**Cost-Saving Approach:**
- Signup: Phone + Password + SMS OTP (one-time cost)
- Login: Phone + Password (no SMS, no cost)
- 90-99% SMS cost reduction vs OTP-every-login

**SMS Provider:**
- Current: Console-only (dev/test)
- Future: Add Vonage/AWS SNS/MSG91 in ~10 lines

**Files Added:**
- `app/(auth)/phone-signup.tsx` (3-step wizard)
- `app/(auth)/phone-login.tsx` (simple login)
- Backend: `POST /auth/login-phone`
- Backend: Updated `/auth/verify-otp` with password support

**UX:**
- Email primary (existing, unchanged)
- Phone secondary (new buttons with OR divider)
- Both methods fully independent


---

## How to update this file

When a Phase 2 feature is built:

1. Move it from the Phase 2 table to the Phase 1/done table
2. Add the file path(s)
3. Change status to ✅ DONE
4. Update the count at the top

