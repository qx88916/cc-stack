# Admin Dashboard Setup & Quick Start Guide

Complete guide to set up and run the CabConnect Admin Dashboard.

## Quick Start (5 minutes)

### Step 1: Ensure Backend is Running

```bash
cd cabconnect-backend-main
npm run dev
```

Backend should be running at http://localhost:5000

### Step 2: Create Admin User

Run the seed script:

```bash
cd cabconnect-backend-main
npx ts-node scripts/seed-admin.ts
```

This creates an admin user with:
- Email: `admin@cabconnect.com`
- Password: `Admin@123456`

### Step 3: Install Admin Dashboard Dependencies

```bash
cd cabconnect-admin-app
npm install
```

### Step 4: Run Admin Dashboard

```bash
npm run dev
```

Dashboard will be available at http://localhost:3001

### Step 5: Login

1. Open http://localhost:3001
2. Login with admin credentials
3. You're in! 🎉

## Detailed Setup

### Backend Configuration

1. **Update CORS settings** (if needed)

Edit `cabconnect-backend-main/.env`:

```env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3001
```

Add `http://localhost:3001` to allow admin dashboard requests.

2. **Verify admin routes are mounted**

Check `cabconnect-backend-main/src/index.ts`:

```typescript
app.use('/admin', adminRouter);
```

✅ Already done if you followed the implementation plan.

3. **Start backend**

```bash
cd cabconnect-backend-main
npm run dev
```

Verify at http://localhost:5000/health

### Frontend Configuration

1. **Environment variables**

Copy the example file:

```bash
cd cabconnect-admin-app
cp .env.local.example .env.local
```

Edit `.env.local` if your backend runs on a different URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=CabConnect Admin
```

2. **Install dependencies**

```bash
npm install
```

This installs:
- Next.js 15
- React 19
- TanStack Query
- Axios
- shadcn/ui components
- Tailwind CSS
- And more...

3. **Run development server**

```bash
npm run dev
```

The app runs on port 3001 (not 3000 to avoid conflicts with other Next.js apps).

## Testing the Setup

### 1. Test Backend API

```bash
curl http://localhost:5000/health
```

Expected: `{"ok":true}`

### 2. Test Admin Login API

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cabconnect.com","password":"Admin@123456"}'
```

Expected: JSON with `token` and `user` object.

### 3. Test Admin Routes

First, get the token from login, then:

```bash
curl http://localhost:5000/admin/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: JSON with dashboard statistics.

### 4. Test Frontend

1. Open http://localhost:3001
2. Should redirect to http://localhost:3001/login
3. Enter credentials:
   - Email: `admin@cabconnect.com`
   - Password: `Admin@123456`
4. Should redirect to http://localhost:3001/dashboard
5. You should see dashboard stats

## Features Guide

### Dashboard Page

**URL**: `/dashboard`

Shows:
- Total users (passengers, drivers, admins)
- Online drivers count
- Total revenue from completed rides
- Active rides in progress
- Detailed ride statistics
- User breakdown by role

### Users Management

**URL**: `/dashboard/users`

Features:
- **Search**: By email, phone, or name
- **Filter by role**: All, Passenger, Driver, Admin
- **Filter by email status**: All, Verified, Unverified
- **Show/hide deleted users**
- **Pagination**: 20 users per page
- **Actions per user**:
  - Verify email (for unverified users)
  - Delete user (soft delete)
  - Restore user (for deleted users)

**Tips:**
- Use search for quick lookups
- Combine filters for precise results
- Click "Refresh" to reload data

### Settings Management

**URL**: `/dashboard/settings`

Three tabs:

**1. Fare Settings**
- Base fare (charged at start of ride)
- Per kilometer rate
- Per minute rate
- Minimum fare
- Surge multiplier (for peak hours)
- Tax rate (as decimal, e.g., 0.1 = 10%)

**2. Geofence Settings**
- Enable/disable geofence
- Maximum ride distance (km)
- Service area center (latitude, longitude)
- Service radius (km)

**3. General Settings**
- App name
- Support email
- Support phone
- Maintenance mode (enable to disable bookings)

**Tips:**
- Changes take effect immediately after saving
- Test fare changes with small adjustments first
- Use maintenance mode for updates

## Customization

### Change Port

Edit `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

Change `3001` to your desired port.

### Change API URL

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Styling

Colors are defined in `app/globals.css` using CSS variables.

To change the primary color, edit:

```css
:root {
  --primary: 222.2 47.4% 11.2%; /* HSL values */
}
```

### Add New Routes

1. Create new file: `app/dashboard/your-route/page.tsx`
2. Add to sidebar: `components/layout/sidebar.tsx`

```typescript
{
  title: 'Your Route',
  href: '/dashboard/your-route',
  icon: YourIcon,
}
```

## Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

Set production variables:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=CabConnect Admin
```

### Deploy

**Option 1: Vercel** (Recommended)

```bash
npm i -g vercel
vercel
```

**Option 2: Docker**

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t cabconnect-admin .
docker run -p 3001:3001 cabconnect-admin
```

**Option 3: Traditional Server**

```bash
npm run build
npm start
```

Use PM2 for process management:

```bash
npm i -g pm2
pm2 start npm --name "admin-dashboard" -- start
```

## Troubleshooting

### "Origin not allowed by CORS"

Add admin dashboard URL to backend CORS:

```env
# In backend .env
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3001
```

### "Access denied. Admin privileges required"

The logged-in user doesn't have admin role. Check:

```bash
# In MongoDB
db.users.findOne({ email: "admin@cabconnect.com" })
```

Ensure `role: "admin"`.

### "Failed to fetch" errors

1. Check backend is running: `curl http://localhost:5000/health`
2. Check CORS settings
3. Check browser console for detailed errors
4. Verify token is being sent (Network tab → Request Headers)

### TypeScript errors

```bash
npx tsc --noEmit
```

Fix any type errors shown.

### Build fails

1. Clear Next.js cache:
```bash
rm -rf .next
```

2. Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

3. Try building again:
```bash
npm run build
```

## Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong JWT_SECRET in backend (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting on admin endpoints
- [ ] Restrict CORS to specific domains (no wildcards)
- [ ] Use environment variables for secrets (never commit .env)
- [ ] Set up activity logging for sensitive actions
- [ ] Regular security audits: `npm audit`

## Performance Tips

1. **Enable caching** (production only):

```typescript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
};
```

2. **Optimize images**:

Use Next.js Image component for profile photos.

3. **Lazy load components**:

```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

## Support

For issues or questions:
- Check backend logs: `cabconnect-backend-main` console
- Check browser console: F12 → Console tab
- Check Network tab: F12 → Network tab
- Review error messages in the UI

## Next Steps

1. ✅ Backend setup complete
2. ✅ Admin user created
3. ✅ Frontend running
4. ✅ Logged in successfully
5. 🎯 **You're ready to manage your platform!**

**What's next?**
- Explore the dashboard features
- Add more admin users if needed
- Configure fare settings
- Set up geofence for your service area
- Monitor user registrations and rides

---

Happy managing! 🚕
