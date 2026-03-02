# Architecture: Parrit

This document describes the current architecture of the application as implemented.

## Database Schema (Supabase)

Two tables, both scoped per workspace via `user_id`.

```mermaid
erDiagram
    AUTH_USERS ||--o{ PEOPLE : "owns"
    AUTH_USERS ||--o{ PAIRING_BOARDS : "owns"

    PEOPLE {
        uuid id PK
        uuid user_id FK
        string name
        string avatar_color_hex
        timestamptz created_at
    }

    PAIRING_BOARDS {
        uuid id PK
        uuid user_id FK
        string name
        boolean is_exempt
        string goal_text
        string meeting_link
        integer sort_order
        uuid[] assigned_person_ids
        timestamptz created_at
    }
```

**Key design decision:** Board assignments are stored as a `uuid[]` array directly on `pairing_boards.assigned_person_ids` rather than a separate join table. This simplifies drag-and-drop persistence — a single upsert per drag event updates the whole board state.

Row Level Security (RLS) ensures each workspace (`auth.users` row) can only read and write its own rows.

See `supabase/schema.sql` for the full setup script.

---

## State Management

Zustand is used for all client-side state:

| Store             | Location                  | Responsibility                            |
| ----------------- | ------------------------- | ----------------------------------------- |
| `useAuthStore`    | `features/auth/store/`    | Session, user, workspace name             |
| `usePairingStore` | `features/pairing/store/` | People, boards, all CRUD + real-time sync |
| `useToastStore`   | `store/`                  | Global toast notifications                |

---

## Real-time Sync

`usePairingStore.subscribeToRealtime()` opens a Supabase Realtime channel that listens to `postgres_changes` on both `people` and `pairing_boards`. Incoming events are diffed against local state and applied minimally (insert/update/delete). The subscription is established after login and torn down on sign-out via the `useEffect` cleanup in `App.tsx`.

---

## Authentication Model

Workspaces use a **pseudonym email strategy**: the workspace name entered by the user is combined with a fixed domain (`@parrit.com`) to form a synthetic email, which is passed to Supabase's email/password auth. This means:

- No real email address is collected
- No email confirmation inbox is required (disabled in Supabase dashboard)
- Each workspace is a distinct Supabase auth user — data is isolated by `user_id`

See [ADR-0001](../adr/0001-workspace-pseudonym-authentication.md) for full rationale.

---

## Key User Journeys

### Sign-up and first load

```mermaid
sequenceDiagram
    participant U as User
    participant A as AuthScreen
    participant S as Supabase Auth
    participant P as usePairingStore

    U->>A: Enters workspace name + password
    A->>S: signUp(workspace@parrit.com, password)
    S-->>A: Session established
    A-->>U: Redirected to Dashboard
    P->>S: loadWorkspaceData()
    S-->>P: Empty (first login)
    P->>S: Seed 3 boards + 3 default people
    S-->>P: Seeded rows returned
    P-->>U: Board + team rendered
```

### Drag-and-drop pairing

```mermaid
sequenceDiagram
    participant U as User
    participant W as PairingWorkspace
    participant Z as usePairingStore
    participant S as Supabase

    U->>W: Drags person to board
    W->>Z: setBoards(updatedBoards)
    Z-->>W: Local state updated (instant)
    Z->>S: persistBoardAssignments (upsert)
    S-->>Z: Confirmed
    S-->>Z: Realtime event broadcast to other tabs
    Z-->>W: Other tabs update automatically
```
