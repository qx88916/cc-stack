# CabConnect Admin Dashboard

Modern admin dashboard for managing the CabConnect ride-hailing platform.

## Features

- **Dashboard Overview** - Key metrics and statistics
- **User Management** - View, search, filter, and manage users
- **Settings Management** - Configure fare rates, geofence, and general settings
- **Secure Authentication** - Admin-only access with JWT authentication

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: TanStack Query (React Query) + Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

## Prerequisites

- Node.js 18+ and npm
- Running CabConnect backend (port 5000)
- Admin user created in the backend

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=CabConnect Admin
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3001

## Backend Setup

Before using the admin dashboard, ensure the backend is set up:

1. Create admin user by running the seed script in the backend:
```bash
cd ../cabconnect-backend-main
npx ts-node scripts/seed-admin.ts
```

Default credentials:
- Email: `admin@cabconnect.com`
- Password: `Admin@123456`

**⚠️ Change the password after first login!**

## Usage

### Login

1. Navigate to http://localhost:3001
2. Enter admin credentials
3. You'll be redirected to the dashboard

### Dashboard

View key metrics:
- Total users (passengers, drivers, admins)
- Online drivers
- Total revenue from completed rides
- Active rides

### User Management

- Search users by email, phone, or name
- Filter by role (passenger/driver/admin)
- Filter by email verification status
- View/hide deleted users
- Actions:
  - Verify email manually
  - Soft delete users
  - Restore deleted users

### Settings

**Fare Settings:**
- Base fare
- Per kilometer rate
- Per minute rate
- Minimum fare
- Surge multiplier
- Tax rate

**Geofence Settings:**
- Enable/disable geofence
- Maximum ride distance
- Service area center coordinates
- Service radius

**General Settings:**
- App name
- Support email and phone
- Maintenance mode toggle

## Project Structure

```
cabconnect-admin-app/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Overview dashboard
│   │   ├── users/
│   │   │   └── page.tsx        # User management
│   │   └── settings/
│   │       └── page.tsx        # Settings management
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home redirect
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx         # Navigation sidebar
│   │   └── navbar.tsx          # Top navbar
│   ├── auth-guard.tsx          # Auth protection wrapper
│   └── providers.tsx           # React Query provider
├── lib/
│   ├── api.ts                  # Axios instance with interceptors
│   └── utils.ts                # Utility functions
└── types/
    └── index.ts                # TypeScript interfaces
```

## API Integration

The admin dashboard communicates with the backend via REST API:

**Base URL**: `http://localhost:5000`

**Endpoints Used:**
- `POST /auth/login` - Admin login
- `GET /admin/stats/overview` - Dashboard statistics
- `GET /admin/users` - List users with pagination
- `DELETE /admin/users/:id` - Soft delete user
- `POST /admin/users/:id/restore` - Restore deleted user
- `PATCH /admin/users/:id/verify-email` - Verify email
- `GET /admin/settings` - Get all settings
- `PATCH /admin/settings/fare` - Update fare settings
- `PATCH /admin/settings/geofence` - Update geofence settings
- `PATCH /admin/settings/general` - Update general settings

## Security

- JWT token-based authentication
- Admin role verification
- Automatic token refresh
- Protected routes with AuthGuard
- CORS enabled for admin origin
- Input validation on all forms

## Development

**Run development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm start
```

**Lint code:**
```bash
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `CabConnect Admin` |

## Troubleshooting

**Cannot login:**
- Ensure backend is running on port 5000
- Verify admin user exists (run seed script)
- Check browser console for errors
- Verify CORS settings in backend

**API errors:**
- Check backend logs
- Verify JWT_SECRET is set in backend .env
- Ensure admin routes are mounted in backend

**Build errors:**
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

## License

Proprietary - CabConnect
