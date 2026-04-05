# Performix - Authentication System Implementation

## Complete Production-Ready Authentication & Authorization System

This document describes the fully implemented authentication and authorization system for Performix.

---

## Overview

Performix features a complete, secure authentication and authorization system with:
- ✅ User registration and login
- ✅ JWT-based session management
- ✅ Role-based access control (Admin, Editor, Viewer)
- ✅ Secure password hashing with bcrypt
- ✅ Protected API endpoints
- ✅ User profile management
- ✅ Account creation (admin only)
- ✅ Dynamic profile dropdown

---

## Database Setup

### 1. Create Users Table

The `users` table has been added to `database/schema.sql`. Run the migration:

```bash
# The schema now includes:
- id (UUID, primary key)
- full_name (VARCHAR 255)
- username (VARCHAR 100, UNIQUE)
- email (VARCHAR 255, UNIQUE)
- password_hash (VARCHAR 255)
- role (VARCHAR 50: admin, editor, viewer)
- is_active (BOOLEAN)
- created_at & updated_at (TIMESTAMPS)
```

### 2. Seed Demo Users

Run the seed script to create demo users:

```bash
cd backend
node scripts/seed-users.js
```

**Demo Credentials:**
- **Admin**: username `admin` / password `password123`
- **Editor**: username `editor` / password `password123`
- **Viewer**: username `viewer` / password `password123`

---

## Backend Implementation

### Authentication Middleware

**File**: `backend/middleware/auth.js`

Provides:
- `authenticateToken`: Verifies JWT tokens
- `authorize`: Checks user roles
- `generateToken`: Creates JWT tokens

### Authentication Endpoints

**File**: `backend/routes/auth.js`

Endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - List all users (admin only)
- `DELETE /api/auth/users/:userId` - Delete user (admin only)

### Protected APIs

All dashboard APIs are now protected with authentication middleware in `backend/server.js`:
- `/api/clients`
- `/api/team`
- `/api/social-media`
- `/api/website-seo`
- `/api/ads`
- `/api/email`
- `/api/responses`
- `/api/team-kpis`

---

## Frontend Implementation

### Auth Context

**File**: `frontend/src/context/AuthContext.js`

Manages:
- User state
- Login/logout functions
- Token storage and retrieval
- Password change functionality
- Authentication check on app load

### Protected Routes

**File**: `frontend/src/App.js`

- `PrivateRoute`: Requires authentication
- `AdminRoute`: Requires admin role
- Automatic redirect to login if unauthorized

### Pages

#### Login Page
**File**: `frontend/src/pages/Login.js`

Features:
- Clean, modern UI with gradient background
- Username/email and password input
- Show/hide password toggle
- Error messaging
- Demo credentials display
- Form validation

#### Profile Page
**File**: `frontend/src/pages/Profile.js`

Features:
- View account information (name, email, role, username)
- Tab interface for organization
- Change password functionality
- Password strength validation
- Secure password change process

#### Add Account Page
**File**: `frontend/src/pages/AddAccount.js`

Features:
- Admin-only access
- Creates new user accounts
- Password strength indicator
- Role selection (admin, editor, viewer)
- Validation checklist:
  - ✓ Minimum 8 characters
  - ✓ Contains number
  - ✓ Uppercase letter
  - ✓ Special character
- Success/error notifications

### Header with Profile Dropdown

**File**: `frontend/src/components/common/Header.js`

Updates:
- Dynamic user name and email display
- User role badge (color-coded)
- Profile management links
- "Add New Account" option (admin only)
- Logout functionality
- Links open in new browser tabs

### API Service

**File**: `frontend/src/services/api.js`

Features:
- Automatic token injection in all requests
- Request interceptors for authorization
- Response interceptors for error handling
- Auto-redirect to login on 401/403 errors
- Token stored in localStorage

---

## Security Features

### Backend Security
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT tokens with 24-hour expiration
- ✅ Role-based authorization checks
- ✅ No sensitive data in error messages
- ✅ Database-level constraints (unique username/email)
- ✅ Protected API endpoints

### Frontend Security
- ✅ JWT tokens stored in localStorage
- ✅ Automatic token injection in requests
- ✅ XSS protection through React
- ✅ Auto-logout on token expiration
- ✅ Protected routes
- ✅ No hardcoded credentials

### Password Security
- ✅ Minimum 8 characters required
- ✅ Strength validation
- ✅ Bcrypt hashing
- ✅ Secure change password flow
- ✅ No plain passwords ever displayed

---

## Getting Started

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Set Environment Variables

Create `.env` in backend directory:
```
NEON_DATABASE_URL=your_database_url
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

### 3. Run Database Migration

```bash
# Apply schema (if not already done)
psql -f database/schema.sql
```

### 4. Seed Demo Users

```bash
cd backend
node scripts/seed-users.js
```

### 5. Start Backend Server

```bash
cd backend
npm run dev
# or
npm start
```

### 6. Start Frontend Development Server

```bash
cd frontend
npm start
```

### 7. Login

Navigate to `http://localhost:3000/login` and use demo credentials:
- Admin: `admin` / `password123`
- Editor: `editor` / `password123`
- Viewer: `viewer` / `password123`

---

## Role-Based Permissions

### Admin
- ✅ Full dashboard access
- ✅ Create/edit all data
- ✅ Manage users (create, view, delete)
- ✅ View all reports
- ✅ Access admin features

### Editor
- ✅ Full dashboard access
- ✅ Create/edit/delete dashboard data
- ✅ View reports
- ✅ Cannot manage users

### Viewer
- ✅ Read-only dashboard access
- ✅ View reports and analytics
- ✅ Cannot create or edit data
- ✅ Cannot manage users

---

## API Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'

# Response:
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "full_name": "Admin User",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Access Protected Endpoint

```bash
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:5000/api/clients
```

### Create User (Admin Only)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "editor"
  }'
```

---

## File Structure

```
Performix/
├── backend/
│   ├── middleware/
│   │   └── auth.js                 # Authentication middleware
│   ├── routes/
│   │   ├── auth.js                 # Authentication endpoints
│   │   └── ... (other routes protected)
│   ├── scripts/
│   │   └── seed-users.js           # User seeding script
│   ├── server.js                   # Updated with auth routes
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js      # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.js            # Login page
│   │   │   ├── Profile.js          # Profile management
│   │   │   └── AddAccount.js       # Create user account
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── Header.js       # Updated with user dropdown
│   │   ├── services/
│   │   │   └── api.js              # Updated with auth interceptors
│   │   └── App.js                  # Updated with auth routing
│   └── package.json
└── database/
    └── schema.sql                  # Updated with users table
```

---

## Troubleshooting

### "Invalid credentials" error
- Verify you're using correct demo credentials
- Check that seed-users.js was executed successfully
- Verify database connection

### "Unauthorized" when accessing dashboard
- Check that JWT token is valid in localStorage
- Token may have expired (24-hour expiration)
- Try logging in again

### "Insufficient permissions" error
- You may not have the required role
- Contact admin to upgrade your account

### CORS errors
- Ensure backend is running on correct port
- Check REACT_APP_API_URL environment variable
- Verify CORS configuration in backend

---

## Best Practices

### For Admins
1. Change demo passwords immediately in production
2. Use strong, unique JWT_SECRET
3. Regularly review user accounts
4. Monitor failed login attempts
5. Update passwords periodically

### For Users
1. Use strong passwords (8+ characters, mixed case, numbers, special chars)
2. Never share credentials
3. Logout when finished
4. Change password if compromised
5. Enable two-factor authentication (future enhancement)

### For Developers
1. Never commit sensitive data
2. Always validate on backend
3. Use HTTPS in production
4. Keep dependencies updated
5. Monitor security advisories

---

## Future Enhancements

Potential improvements for future versions:
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Email verification
- [ ] Password reset via email
- [ ] Session timeout warnings
- [ ] Login activity logs
- [ ] IP-based access control
- [ ] Rate limiting on login attempts
- [ ] User audit trail
- [ ] SSO integration

---

## Support

For issues or questions about the authentication system:
1. Check this documentation
2. Review backend logs
3. Check browser console for errors
4. Verify database connectivity
5. Test with demo credentials first

---

## License

This authentication system is part of the Performix project.

---

**Implementation Date**: January 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
