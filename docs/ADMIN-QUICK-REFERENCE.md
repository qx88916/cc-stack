# Admin Dashboard - Quick Reference

## 🚀 Quick Start Commands

### Start Backend
```bash
cd cabconnect-backend-main
npm run dev
```
Runs at: http://localhost:5000

### Create Admin User (First Time Only)
```bash
cd cabconnect-backend-main
npx ts-node scripts/seed-admin.ts
```

### Start Admin Dashboard
```bash
cd cabconnect-admin-app
npm install  # First time only
npm run dev
```
Runs at: http://localhost:3001

## 🔑 Default Credentials

- **Email**: `admin@cabconnect.com`
- **Password**: `Admin@123456`

⚠️ Change password after first login!

## 📍 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:5000 | REST API |
| Health Check | http://localhost:5000/health | Backend status |
| Admin Dashboard | http://localhost:3001 | Web UI |
| Login Page | http://localhost:3001/login | Admin login |

## 🛣️ API Endpoints

### Authentication
- `POST /auth/login` - Admin login

### Admin Routes (require Bearer token + admin role)
- `GET /admin/stats/overview` - Dashboard stats
- `GET /admin/users` - List users (with filters)
- `GET /admin/users/:id` - User details
- `PATCH /admin/users/:id` - Update user
- `PATCH /admin/users/:id/role` - Change role
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users/:id/restore` - Restore user
- `PATCH /admin/users/:id/verify-email` - Verify email
- `GET /admin/settings` - Get settings
- `PATCH /admin/settings/fare` - Update fare
- `PATCH /admin/settings/geofence` - Update geofence
- `PATCH /admin/settings/general` - Update general

## 📄 Pages

| Page | Path | Features |
|------|------|----------|
| Login | `/login` | Email/password auth |
| Dashboard | `/dashboard` | Stats overview |
| Users | `/dashboard/users` | User management |
| Settings | `/dashboard/settings` | System config |

## 🎯 Common Tasks

### Add New Admin User
1. Go to Users page
2. Find the user
3. Click edit → Change role to "admin"

OR via MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Change Fare Rates
1. Go to Settings → Fare Settings tab
2. Update values
3. Click "Save Fare Settings"

### Enable/Disable Service Area
1. Go to Settings → Geofence tab
2. Toggle "Geofence Enabled"
3. Set center coordinates and radius
4. Click "Save Geofence Settings"

### Put System in Maintenance
1. Go to Settings → General tab
2. Set "Maintenance Mode" to "Enabled"
3. Click "Save General Settings"
4. Users will see maintenance message

### Verify User Email Manually
1. Go to Users page
2. Find unverified user
3. Click ✓ icon (UserCheck)
4. Email marked as verified

### Delete/Restore User
1. Go to Users page
2. Find user
3. Click trash icon to delete
4. Toggle "Show Deleted" → Click restore icon

## 🔍 Filters & Search

### User Search
- By email, phone, or name
- Case-insensitive
- Press Enter or click search icon

### User Filters
- **Role**: All, Passenger, Driver, Admin
- **Email Status**: All, Verified, Unverified
- **Show Deleted**: Yes/No

### Pagination
- 20 users per page
- Use Previous/Next buttons
- Current page shown

## 🎨 UI Components

### Badges
- **Admin** - Purple
- **Driver** - Blue
- **Passenger** - Green

### Status Indicators
- ✓ Verified (green)
- Not verified (gray)
- Deleted (opacity reduced)

## ⚙️ Configuration

### Environment Variables

**Backend** (`.env`):
```env
ADMIN_DEFAULT_EMAIL=admin@cabconnect.com
ADMIN_DEFAULT_PASSWORD=YourSecurePassword
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3001
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=CabConnect Admin
```

### Change Port

**Backend** (`package.json`):
```json
"dev": "ts-node src/index.ts"  // Uses PORT env var
```

**Frontend** (`package.json`):
```json
"dev": "next dev -p 3001"  // Change 3001 to desired port
```

## 🐛 Troubleshooting

### "Origin not allowed by CORS"
Add admin URL to backend ALLOWED_ORIGINS:
```env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3001
```

### "Access denied. Admin privileges required"
User doesn't have admin role. Run:
```bash
cd cabconnect-backend-main
npx ts-node scripts/seed-admin.ts
```

### Can't login
1. Backend running? Check http://localhost:5000/health
2. Admin user exists? Run seed script
3. Correct credentials?
4. Check browser console for errors

### npm install fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails
```bash
rm -rf .next
npm run build
```

## 📊 Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Total Users | All non-deleted users |
| Online Drivers | Drivers currently online |
| Total Revenue | Sum of completed ride fares |
| Active Rides | Rides in progress |

## 🔐 Security Notes

- JWT tokens expire after 7 days
- Admin routes require `requireAdmin` middleware
- Soft delete preserves data
- All passwords hashed with bcrypt
- CORS restricts API access
- No sensitive data in logs

## 📝 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Submit form / Search |
| Esc | Close modal (future) |
| Tab | Navigate form fields |

## 🔄 Data Refresh

- Dashboard: Manual refresh button
- Users: Manual refresh button
- Settings: Auto-refresh after save
- All pages: React Query caches for 1 minute

## 📦 Dependencies

**Backend**:
- Express, Mongoose
- JWT, bcrypt
- TypeScript, ts-node

**Frontend**:
- Next.js 15, React 19
- TanStack Query, Axios
- Tailwind CSS, shadcn/ui
- React Hook Form, Zod

## 🆘 Support

1. Check SETUP_GUIDE.md for detailed setup
2. Check ADMIN-DASHBOARD-IMPLEMENTATION.md for technical details
3. Review error messages in:
   - Backend console
   - Browser console (F12)
   - Network tab (F12 → Network)

## ✅ Verification Checklist

- [ ] Backend running at :5000
- [ ] Admin user created
- [ ] Frontend running at :3001
- [ ] Can login successfully
- [ ] Dashboard shows stats
- [ ] Users page loads
- [ ] Settings page loads
- [ ] Can save settings

---

**All systems ready!** 🎉
