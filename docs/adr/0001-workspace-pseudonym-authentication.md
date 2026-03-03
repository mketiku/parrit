# ADR 0001: Workspace-based Pseudonym Authentication

## Status

Accepted

## Context

Standard authentication (individual emails) presents several challenges in an enterprise pairing environment:

1. **PII Concerns**: Collecting personal or work emails requires privacy reviews and storage compliance.
2. **Connectivity Issues**: Confirming emails can be hindered by corporate firewalls or email delivery delays, causing friction during onboarding.
3. **Shared Ownership**: Pairing boards are inherently team-oriented; individual accounts create barriers to entering a "shared room."

## Decision

We will use a **Workspace Name** as the primary identifier instead of a personal email.

- The UI asks for a "Workspace Name" and "Password."
- The application internally transforms the workspace name (e.g., `apollo-team`) into a pseudo-email format (`apollo-team@parrit.com`) to interface with Supabase's standard email/password authentication engine.
- This pseudo-email is never exposed to the user.

## Consequences

### Positive

- **No PII**: No real email addresses are stored in the authentication table.
- **Zero Friction**: No "verify your email" step (when configured in Supabase to auto-confirm).
- **Team-first**: One workspace login can be shared among a trusted squad.

### Negative

- **No Self-Recovery**: Users cannot reset their password via email if forgotten. A database administrator must manually reset the password from the Supabase dashboard.
- **Auditing**: All changes appear as the "Workspace" user, making it harder to track individual team member movement at the database level.

## References

Supabase `auth.signUp` and `auth.signInWithPassword` methods are used for this implementation.
