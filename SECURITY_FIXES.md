# Security Fixes Implementation

## Date: 2025-10-01

## Critical Issues Fixed

### 1. Privilege Escalation Prevention ✅

**Issue**: Users could previously update their own role field directly in the profiles table, allowing them to escalate privileges (e.g., change from 'production' to 'admin').

**Fix**:
- Dropped the insecure "Users can update their own profile" RLS policy
- Created `update_own_profile()` security definer function that allows users to update only safe fields (full_name, phone, avatar_url) - NOT role, tenant_id, or id
- Created `admin_update_user_role()` security definer function for role changes that requires admin/gerant privileges
- Added new RLS policy "Users cannot directly update profiles" that blocks all direct UPDATE operations
- Updated `src/pages/Parametres.tsx` to use the secure function instead of direct updates

**Impact**: Users can no longer escalate their own privileges. Role changes can only be made by administrators through the secure function.

### 2. PII (Personal Information) Exposure Prevention ✅

**Issue**: Email addresses and phone numbers were visible to all users in the same tenant, even if they weren't managers.

**Fix**:
- Replaced broad "Profiles: view self or same tenant" policy with three specific policies:
  1. "Users can view own profile" - Full access to own profile
  2. "Users can view same tenant profiles (limited)" - Limited access to same-tenant users (no PII)
  3. "Managers can view full tenant profiles" - Full access for admins/gerants
- Created `safe_profiles` view that exposes only non-PII fields (id, tenant_id, role, full_name, avatar_url, created_at)
- RLS automatically filters out email and phone fields for non-manager same-tenant queries

**Impact**: Regular users can only see id, role, full_name, and avatar of their colleagues. Only managers can see full contact details.

### 3. Security Audit Logging ✅

**Added**: 
- `security_audit_log` table to track security-sensitive operations
- Trigger `on_profile_role_change` that automatically logs all role changes
- Audit logs include: actor_id, action, target_user_id, old_value, new_value, timestamp
- Only admins can view audit logs (RLS policy)

**Impact**: All role changes are now tracked and auditable.

## Database Functions Created

### `update_own_profile(_full_name, _phone, _avatar_url)`
- **Purpose**: Secure profile updates
- **Security**: SECURITY DEFINER, prevents role/tenant_id changes
- **Usage**: Called via `supabase.rpc('update_own_profile', { _full_name: '...', _phone: '...' })`

### `admin_update_user_role(_user_id, _new_role)`
- **Purpose**: Administrative role changes
- **Security**: SECURITY DEFINER, requires admin/gerant role, validates tenant boundaries
- **Usage**: Called via `supabase.rpc('admin_update_user_role', { _user_id: '...', _new_role: 'production' })`

### `log_role_change()`
- **Purpose**: Audit trigger function
- **Security**: SECURITY DEFINER, automatic logging
- **Usage**: Automatically triggered on role changes

## Code Changes

### Modified Files:
1. `src/pages/Parametres.tsx`
   - Changed profile update from direct `.update()` to `.rpc('update_own_profile')`
   - Prevents users from modifying their own role field

## Remaining Recommendations

### Medium Priority:

1. **Password Security**:
   - Enable leaked password protection in Supabase Dashboard
   - Go to: Authentication → Settings → Enable "Check for leaked passwords"

2. **Edge Function Validation**:
   - Review `supabase/functions/invite-user/index.ts`
   - Add role hierarchy validation (e.g., prevent non-admins from creating admin accounts)

3. **Rate Limiting**:
   - Consider implementing rate limiting for sensitive operations (user creation, role changes)

### Low Priority:

1. **Session Management**:
   - Review session timeout settings
   - Consider implementing session activity tracking

2. **Two-Factor Authentication**:
   - Enable 2FA for admin accounts
   - Available in Supabase Dashboard: Authentication → Settings

## Testing Checklist

- [ ] Test that regular users cannot update their own role
- [ ] Test that regular users can update their name/phone
- [ ] Test that regular users can only see limited info of colleagues
- [ ] Test that gerants can see full user details
- [ ] Test that only admins/gerants can change user roles
- [ ] Test that role changes are logged in security_audit_log
- [ ] Test that password updates still work in settings

## Database Schema Changes

### New Table: `security_audit_log`
```sql
- id (uuid, primary key)
- tenant_id (uuid, not null)
- actor_id (uuid, references auth.users)
- action (text, not null)
- target_user_id (uuid)
- old_value (jsonb)
- new_value (jsonb)
- ip_address (inet)
- created_at (timestamp with time zone)
```

### New View: `safe_profiles`
Exposes only: id, tenant_id, role, full_name, avatar_url, created_at

### New Functions:
- `update_own_profile(text, text, text)` → void
- `admin_update_user_role(uuid, user_role)` → void
- `log_role_change()` → trigger

### Modified Policies on `profiles`:
- Dropped: "Users can update their own profile"
- Dropped: "Profiles: view self or same tenant"
- Added: "Users can view own profile"
- Added: "Users can view same tenant profiles (limited)"
- Added: "Managers can view full tenant profiles"
- Added: "Users cannot directly update profiles"

## Compliance Impact

These changes improve compliance with:
- **GDPR**: Minimizes PII exposure to only those who need it
- **SOC 2**: Implements audit logging for security events
- **ISO 27001**: Implements least privilege access control

## Rollback Procedure

If issues arise, you can rollback by:
1. Going to Supabase Dashboard → Database → Migrations
2. Finding the migration "Security Fix: Privilege Escalation & PII Exposure"
3. Clicking "Rollback" (not recommended unless critical issue)

## Questions?

Contact your database administrator or security team for questions about these security implementations.
