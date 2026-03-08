# 🚀 Quick Start - Test Profile Photo Upload

## Prerequisites
- Backend running on `http://localhost:5000`
- Passenger app running
- User logged in

## Test Steps (5 Minutes)

### 1. Start Backend
```bash
cd cabconnect-backend-main
npm run dev
```

Wait for: `✅ MongoDB connected`

---

### 2. Start Passenger App
```bash
cd cabconnect-passenger-app
npm start
```

Press `a` for Android or `i` for iOS

---

### 3. Test Camera Upload

1. **Login** to the app
2. **Tap "Profile" tab** (bottom navigation)
3. **Tap the profile photo circle**
4. Select **"Take Photo"**
5. **Allow camera permission** (first time only)
6. Take a photo
7. Adjust/crop if prompted
8. Tap **"Use Photo"** or **"Confirm"**

**Expected Result:**
- ✅ Loading spinner appears
- ✅ "Profile photo updated successfully!" alert
- ✅ Photo displays in circular frame immediately

---

### 4. Test Gallery Upload

1. **Tap the profile photo again**
2. Select **"Choose from Gallery"**
3. **Allow photo library permission** (first time only)
4. Select any photo
5. Crop to square
6. Tap **"Choose"** or **"Confirm"**

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Success alert
- ✅ New photo replaces old one

---

## ✅ Success Indicators

### Visual Checks
- [ ] Default avatar (green background, initials) shows before upload
- [ ] Camera icon (📷) visible on bottom-right of photo circle
- [ ] "Tap to change photo" text below circle
- [ ] Photo is perfectly circular (not stretched/distorted)
- [ ] Loading spinner appears during upload
- [ ] "Uploading..." text shows during upload

### Functional Checks
- [ ] Camera permission dialog appears (first time)
- [ ] Gallery permission dialog appears (first time)
- [ ] Photo uploads within 3 seconds (good network)
- [ ] Success alert shows after upload
- [ ] Photo persists after closing/reopening app
- [ ] Old photo is replaced when uploading new one

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Cannot reach backend"
**Fix:** Ensure backend is running on port 5000
```bash
# Check if backend is running
curl http://localhost:5000/health
# Should return: {"ok":true}
```

### Issue: "Permission denied"
**Fix:** Go to device Settings → Apps → CabConnect → Permissions → Enable Camera/Photos

### Issue: Photo doesn't update
**Fix:** Pull down on profile screen to refresh, or restart app

### Issue: "Upload failed with status 401"
**Fix:** Log out and log back in (token might be expired)

---

## 📸 Test Matrix

| Test Case | Camera | Gallery | Result |
|-----------|--------|---------|--------|
| Happy path | ✅ | ✅ | Pass |
| Permission denied | ⚠️ | ⚠️ | Error shown |
| Large file (>5MB) | ❌ | ❌ | Error: "File too large" |
| Network offline | ❌ | ❌ | Error: "Upload failed" |
| Cancel selection | ⏹️ | ⏹️ | No upload triggered |

---

## 🎯 Next: Profile Info Editing

Once photo upload works, test these (coming next):
- [ ] Edit name
- [ ] Edit phone number
- [ ] Add home/work locations
- [ ] Email verification

---

## 📝 Notes

- **First upload**: ~2-3 seconds (includes file processing)
- **Subsequent uploads**: ~1-2 seconds (faster due to caching)
- **Photo format**: JPEG or PNG only
- **Photo size**: Max 5MB
- **Photo resolution**: Auto-optimized to 80% quality
- **Storage location**: `backend/uploads/profiles/`

---

**Ready to test?** Start with Step 1 above! 🚀
