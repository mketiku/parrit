# Implementation Plan Status: Modern Parrit

This plan outlined the build of Parrit as a modern, premium web application.

## 🏁 Status: Launch Ready

The application has reached full maturity. All core features from the "Ideal Version" are implemented, tested, and optimized.

## ✅ Implemented Features

### 1. Database & Security

- ✅ **Supabase Integration**: Auth, PostgreSQL, and Realtime are fully wired up.
- ✅ **RLS Multi-Tenancy**: Workspace isolation is enforced at the database level.
- ✅ **RLS Fix (Session Updates)**: Users can now edit historical session dates successfully.
- ✅ **Multiple Goals**: Boards support a JSONB array of daily goals.
- ✅ **Workspaces/Settings**: Persistence for onboarding and public view toggles.

### 2. Premium UI/UX

- ✅ **Tropical Theme Engine**: Custom brand/accent tokens and a theme switcher.
- ✅ **Framer Motion**: Smooth animations for transitions and overlays.
- ✅ **Real-time Sync**: Updates reflect instantly across tabs.
- ✅ **Template UI**: Full interface for saving and applying board layouts.
- ✅ **Stale Pair Detector**: Highlights pairs that have been together too long (configurable).
- ✅ **Analytics**: Live heatmap and individual pairing insights.

### 3. Core Logic & Testing

- ✅ **Smart-Pairing Algorithm**: Strategy-based rotation engine that respects "Locked" boards.
- ✅ **Unit Testing Suite**: Logic (`pairingLogic`), Stores (`usePairingStore`), and Hooks (`useHistoryAnalytics`) are covered by Vitest.
- ✅ **Integration Testing**: Critical screens like `HistoryScreen` are verified with Supabase mocks.

## ✅ Completed Considerations

- ✅ **PWA Support**: Native-like installation on mobile/desktop.
- ✅ **Slack/Teams Integration**: Webhooks for daily pairing announcements.
- ✅ **Bulk Selection**: Enhanced selection modes for history management.

## 🛠 Tech Stack

- **Frontend**: Vite + React 19 (TypeScript)
- **Styling**: Tailwind CSS v4
- **State**: Zustand (Store persistence enabled)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel (Edge Functions for OG Images)

## 🚧 Planned Work: Real Email Migration

This section captures the validated implementation plan for migrating Parrit away from synthetic auth emails such as `@parrit.com` and `@parrit.local` and toward real user email addresses.

### Validated Assumptions

- The current auth flow still generates synthetic emails during signup/signin in `src/features/auth/components/AuthScreen.tsx`.
- The authenticated route boundary lives in `src/App.tsx`, which is the correct place to enforce a forced migration gate.
- Workspace display identity is still coupled to auth identity in `src/features/auth/store/useAuthStore.ts` because `workspaceName` falls back to `user.email.split('@')[0]`.
- Settings currently supports password updates but not email updates in `src/features/settings/components/SettingsScreen.tsx`.
- Terms still claim that Parrit does not collect emails in `src/features/static/components/TermsScreen.tsx`.
- Supabase email-change confirmation is enabled in `supabase/config.toml` via `double_confirm_changes = true`.
- SMTP is not configured in local repo config, so outbound email delivery must be treated as a release prerequisite before forcing migration in production.

### Corrected Assumptions

- The repo currently generates `@parrit.com`, not `@parrit.local`.
- This is not only a settings enhancement. It is an auth-model migration with a temporary compatibility window for legacy users.

### Phase 0: Release Preconditions

Goal: make the migration technically safe before changing user flows.

Steps:

- Confirm production has working email delivery for Supabase auth emails.
- Confirm production redirect URLs and email templates support email-change confirmation.
- Decide whether synthetic domains include both `@parrit.com` and `@parrit.local` for backward compatibility.
- Decide whether new signups should require email confirmation immediately or continue with `enable_confirmations = false`.

Acceptance criteria:

- Product decision is recorded for supported synthetic domains.
- Production email delivery path is verified outside local dev.
- Release note is prepared stating that forced migration depends on working email-change confirmation.

### Phase 1: Add Synthetic-Email Detection

Goal: centralize migration eligibility logic so the app stops hardcoding domain assumptions in multiple places.

Steps:

- Add an auth helper such as `isSyntheticEmail(email: string | null | undefined): boolean`.
- Add a derived auth-store flag such as `requiresEmailMigration`.
- Reuse the same logic for route gating and settings UI.
- Add unit tests covering synthetic and real email cases.

Acceptance criteria:

- A single helper decides whether a user must migrate.
- `useAuthStore` exposes migration state without duplicating domain logic.
- Unit tests cover `@parrit.com`, `@parrit.local`, real emails, and empty/null values.

### Phase 2: Decouple Workspace Display From Email

Goal: prevent email changes from mutating workspace identity in the UI.

Steps:

- Remove `user.email?.split('@')[0]` fallback from `src/features/auth/store/useAuthStore.ts`.
- Use `user.user_metadata.workspace_name` first.
- Define a neutral non-email fallback such as `Workspace ${user.id.slice(0, 5)}`.
- Audit obvious `workspaceName` consumers in `src/App.tsx`, layout components, and pairing headers.

Acceptance criteria:

- Changing a user email no longer changes workspace display labels.
- The app still renders a stable workspace label for older users missing `workspace_name`.
- Authenticated screens continue to work without relying on email-local-part parsing.

### Phase 3: Add Forced Migration Gate

Goal: users with synthetic emails can still log in, but cannot use the app until they submit a real email.

Steps:

- Add a dedicated migration screen under `src/features/auth/components`, for example `EmailMigrationScreen.tsx`.
- Gate authenticated routes in `src/App.tsx` so authenticated synthetic-email users see the migration screen instead of `AppLayout`.
- Allow only submitting a new email, signing out, and viewing verification instructions.
- Do not load workspace data subscriptions behind the gate if migration is required.

Acceptance criteria:

- A user with a synthetic email who logs in is blocked before reaching `/app`.
- A user with a real email reaches the app normally.
- Sign out works from the migration screen.
- The gate is enforced centrally in `App.tsx`, not duplicated across screens.

### Phase 4: Implement Real Email Update Flow

Goal: let synthetic-email users submit a real email using Supabase’s supported email-change flow.

Steps:

- Add email update form logic using `supabase.auth.updateUser({ email })`.
- Show current email, new email input, submission state, and success/error copy.
- Add copy reflecting `double_confirm_changes = true`, including the possibility of confirming from both old and new addresses.
- Mirror this feature in settings so it remains available after migration.

Acceptance criteria:

- Submitting a valid real email calls `supabase.auth.updateUser({ email })`.
- Success state tells the user exactly what to do next.
- Errors are surfaced clearly.
- The same email-update capability exists in forced migration and in settings.

### Phase 5: Decide and Implement Confirmation Policy

Goal: resolve the product conflict between forced migration and double confirmation.

Decision paths:

- Keep `double_confirm_changes = true`.
- Temporarily disable double confirmation for the migration window.

Steps:

- Do not silently choose one path during implementation.
- Prepare implementation to support the chosen policy.
- Require explicit product/owner confirmation before changing auth configuration.

Acceptance criteria:

- A documented decision exists for migration confirmation behavior.
- Any auth config change is isolated and reviewed explicitly.
- No forced rollout proceeds while this policy remains unresolved.

### Phase 6: Switch Auth UI for New Signups and Future Sign-Ins

Goal: move the product to real-email auth while preserving a temporary path for legacy synthetic users only as long as needed.

Steps:

- Rewrite `src/features/auth/components/AuthScreen.tsx` to use real email plus password for sign in and sign up.
- Collect workspace name separately as metadata rather than using it as the auth identifier.
- Remove pseudo-email generation.
- Update auth tests accordingly.

Acceptance criteria:

- New signups use a real email address.
- Standard sign-in no longer constructs `@parrit.com`.
- Workspace creation still captures a workspace name separately from auth identity.
- Auth tests no longer assert pseudo-email generation behavior.

### Phase 7: Content, Seeds, and Admin Cleanup

Goal: align docs, legal copy, tests, and fixtures with the new auth model.

Steps:

- Update `src/features/static/components/TermsScreen.tsx` to remove claims that Parrit does not collect emails.
- Update ADR and architecture docs describing pseudonym auth.
- Review seeds in `supabase/seed.sql` and `supabase/auth_seed.sql`.
- Review admin UI and tests that currently assume `@parrit.com` is normal behavior.
- Decide whether masked admin displays should continue showing emails or workspace names.

Acceptance criteria:

- No public-facing copy contradicts the actual auth model.
- Fixtures and tests reflect the migration model intentionally.
- Admin behavior around email display is explicitly approved rather than inherited from legacy behavior.

### Verification Plan

- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run auth store tests.
- Run auth screen tests.
- Run settings screen tests.

Targeted behavior coverage:

- Synthetic user initializes auth state and gets `requiresEmailMigration = true`.
- Real-email user initializes auth state and gets `requiresEmailMigration = false`.
- Authenticated synthetic user is routed to the migration gate.
- Migration form submits `updateUser({ email })`.
- Post-migration user is no longer gated.
- New signup/signin use real email inputs only.

If Playwright coverage exists or is added:

- Log in as a synthetic-email user.
- Verify the forced migration screen appears.
- Submit a real email.
- Confirm success instructions are shown.
- Simulate a post-confirmation session and verify app access.

### Explicit Blocker

The major open decision is confirmation semantics. With `double_confirm_changes = true`, legacy synthetic accounts may not be able to confirm from the old address. This is a product and security decision, not just an implementation detail. The app should not force migration in production until this is resolved.
