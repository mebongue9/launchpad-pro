# ARCHITECTURE: Admin User Management System
**Task ID:** admin-user-management-001
**Date:** 2026-01-06
**Requirements Reference:** Plan approved by user, Tech Lead reviewed

## Problem Statement

The app requires authentication but has no way to create users. This is an internal app where admins create users (no public signup). We need:
1. Admin can create new users with email + temporary password
2. Admin can edit user email and promote/demote admin status
3. Admin can delete users
4. Regular users cannot access admin features

## Approach Summary

1. Create `admin_users` table to track who is an admin
2. Create Netlify functions for user management using Supabase Admin API
3. Create shared admin-auth middleware for JWT verification
4. Create frontend Admin page with user management UI
5. Add admin route and conditional sidebar link

## Files to Create

| File Path | Purpose |
|-----------|---------|
| `/supabase/migrations/create-admin-users-table.sql` | Database migration for admin_users table |
| `/netlify/functions/lib/admin-auth.js` | Shared middleware for admin JWT verification |
| `/netlify/functions/admin-check.js` | Check if user is admin |
| `/netlify/functions/admin-list-users.js` | List all users via Supabase Admin API |
| `/netlify/functions/admin-create-user.js` | Create user with optional admin flag |
| `/netlify/functions/admin-update-user.js` | Edit user email and admin status |
| `/netlify/functions/admin-delete-user.js` | Delete user by ID |
| `/src/hooks/useAdmin.jsx` | Hook for admin status and user management |
| `/src/components/auth/AdminRoute.jsx` | Route wrapper requiring admin status |
| `/src/pages/Admin.jsx` | Admin dashboard page |
| `/src/components/admin/CreateUserModal.jsx` | Modal for creating new users |
| `/src/components/admin/EditUserModal.jsx` | Modal for editing users |
| `/src/components/admin/UserList.jsx` | Table component for user list |

## Files to Modify

| File Path | Purpose |
|-----------|---------|
| `/src/App.jsx` | Add /admin route wrapped in AdminRoute |
| `/src/components/layout/Sidebar.jsx` | Add conditional Admin link for admins only |

## Files NOT to Modify

- `/src/hooks/useAuth.jsx` - Keep auth logic separate from admin logic
- `/src/components/auth/ProtectedRoute.jsx` - Unchanged, AdminRoute is separate

## Security Requirements

1. All admin operations verify JWT from Authorization header
2. Service role key only used in Netlify functions (never exposed to client)
3. Admins cannot delete themselves if they are the last admin
4. Emails normalized to lowercase
5. Every admin action logs who performed it

## API Design

### POST /.netlify/functions/admin-check
```json
// Headers: Authorization: Bearer <jwt>
// Response
{ "is_admin": true }
```

### POST /.netlify/functions/admin-list-users
```json
// Headers: Authorization: Bearer <jwt>
// Response
{ "users": [{ "id": "uuid", "email": "...", "is_admin": false, "created_at": "...", "last_sign_in_at": "..." }] }
```

### POST /.netlify/functions/admin-create-user
```json
// Headers: Authorization: Bearer <jwt>
// Request
{ "email": "new@example.com", "password": "TempPass123!", "make_admin": false }
// Response
{ "success": true, "user": { "id": "uuid", "email": "new@example.com" } }
```

### POST /.netlify/functions/admin-update-user
```json
// Headers: Authorization: Bearer <jwt>
// Request
{ "user_id": "uuid", "new_email": "updated@example.com", "make_admin": true }
// Response
{ "success": true }
```

### POST /.netlify/functions/admin-delete-user
```json
// Headers: Authorization: Bearer <jwt>
// Request
{ "user_id": "uuid" }
// Response
{ "success": true }
```

## Database Schema

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  granted_by TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Approval

- [x] Tech Lead Review - Approved with security recommendations
- [ ] Implementation
- [ ] Code Review
- [ ] QA Testing
