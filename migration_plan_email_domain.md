# Auth Email Domain Migration Plan

This document outlines the strategy for migrating existing Supabase Auth users from `@parrit.com` emails to a new target domain, specifically designed for environments where **users do not have access to their inboxes.**

## Goals

- **Shift to Username Login**: Transition from "Email" identity to a "Username/Workspace" identity.
- **Remove Domain Dependency**: Stop using public domains like `@parrit.com` for internal auth records.
- **Zero-Conf Handoff**: Ensure users can log in with their current passwords and "Usernames" without needing email access.

## Phase 1: Preparation & Prerequisites

- [ ] **Internal Domain Selection**: Swap the public `@parrit.com` suffix for an internal one like `@parrit.local`. This informs the users that this is an **Identity**, not a physical inbox.
- [ ] **Code Refactor (Identity)**: Refactor components to use a dedicated `workspace_name` metadata field. (**COMPLETED**)
- [ ] **Identity Data Migration**: Populate the `workspace_name` field for all users before the email domain changes.
- [ ] **OAuth Audit**: Check `auth.identities` for any users using GitHub/Google auth.
- [ ] **Data Audit**: Generate a list of all active users with `@parrit.com` emails.
- [ ] **Full Backup**: Perform a complete backup of the `auth` and `public` schemas.

## Phase 2: Implementation (The "No-Email" Shift)

### 1. Supabase Dashboard Configuration

Ensure these are set **before** running the SQL to prevent lockout:

- [ ] **Auth Settings**: Set "Site URL" to the new application URL.
- [ ] **Redirects**: Update "Additional Redirect URLs" to include the new domain.
- [ ] **Confirmations**: **DISABLE** "Confirm Email" and **DISABLE** "Secure email change".

### 2. The "Zero-Handoff" SQL Update

Execute this in the Supabase SQL Editor. This swaps the email identity while preserving the password hash.

```sql
BEGIN;

-- 1. Update primary Auth User records
UPDATE auth.users
SET
  -- Populate workspace_name metadata from current email prefix (Identity Prereq)
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{workspace_name}',
    to_jsonb(split_part(email, '@', 1))
  ),
  -- Swap the physical identity to the internal pseudo-domain
  email = REPLACE(email, '@parrit.com', '@parrit.local'),
  -- Update the metadata email field for consistency
  raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{email}',
    to_jsonb(REPLACE(email, '@parrit.com', '@parrit.local'))
  ),
  -- Crucial: Force confirm to bypass non-existent email verify
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email LIKE '%@parrit.com';

-- 2. Update Identities table to match the new internal identity
UPDATE auth.identities
SET identity_data = jsonb_set(identity_data, '{email}',
    to_jsonb(REPLACE(email, '@parrit.com', '@parrit.local')))
WHERE identity_data->>'email' LIKE '%@parrit.com';

COMMIT;
```

### 3. Session Cleanup (JWT Invalidation)

- [ ] **Force Re-login**: Users will have a JWT valid for ~1 hour with their old email. They must **Sign Out and Sign In** to receive a new JWT.
- [ ] **Clear Local Storage**: Ensure app-level caches are cleared.

## Phase 3: Identity & Recovery Enhancements

To ensure the "No-Email" model isn't a dead-end, we will implement two key features:

### 1. Username-First Login

- [ ] **Auth UI Refactor**: Rename "Email" to "Username" in the `AuthScreen.tsx`.
- [ ] **Pseudo-Domain Injection**: The app will automatically append `@parrit.local` to the input.

### 2. Linked Recovery Email (The Safety Valve)

- [ ] **Contact Email Field**: Add a "Recovery/Contact Email" field in the `SettingsScreen.tsx`.
- [ ] **Manual Email Update**: Allow users to link a real personal email.
- [ ] **Authenticated Identity Upgrade**: Once confirmed, users can transition to their real email for login.

## Phase 4: Verification & Ongoing Maintenance

- [ ] **Historical Continuity**: Verify that all `pairing_history` records (which use `UUID`) are still correctly associated.
- [ ] **Admin Reset Tools**: Maintain a list of admin users for manual password resets.

## Phase 5: Rollback Strategy

If the migration fails:

1. **Restore Backup**: Use the backup from Phase 1.
2. **Reverse SQL**: Run the `REPLACE` script in reverse (swap `@parrit.local` back to `@parrit.com`).

> [!IMPORTANT]
> Because the destination emails do not exist, users **MUST** remember their current passwords.
