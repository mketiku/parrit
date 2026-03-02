# Architecture & User Journeys: Parrit Modern

This document visualizes the data model and the key user journeys for the "Ideal" version of Parrit.

## 1. Database Schema (Supabase)

```mermaid
erDiagram
    PROFILES ||--o{ MEMBERSHIPS : "belongs to"
    WORKSPACES ||--o{ MEMBERSHIPS : "has"
    WORKSPACES ||--o{ PEOPLE : "contains"
    WORKSPACES ||--o{ PAIRING_BOARDS : "contains"
    WORKSPACES ||--o{ PAIRING_SESSIONS : "has"
    WORKSPACES ||--o{ BOARD_TEMPLATES : "saves"
    
    PAIRING_BOARDS ||--o{ PAIRING_ASSIGNMENTS : "assigned to"
    PEOPLE ||--o{ PAIRING_ASSIGNMENTS : "involved in"
    PAIRING_SESSIONS ||--o{ PAIRING_ASSIGNMENTS : "consists of"

    PROFILES {
        uuid id PK
        string display_name
        string avatar_url
        timestamp created_at
    }

    WORKSPACES {
        uuid id PK
        string name
        uuid owner_id FK
        boolean public_view_enabled
        timestamp created_at
    }

    MEMBERSHIPS {
        uuid id PK
        uuid profile_id FK
        uuid workspace_id FK
        enum role "OWNER, EDITOR, VIEWER"
    }

    PEOPLE {
        uuid id PK
        uuid workspace_id FK
        string name
        string avatar_color_hex
    }

    PAIRING_BOARDS {
        uuid id PK
        uuid workspace_id FK
        string name
        boolean is_exempt
        string goal_text
        string meeting_link
    }

    PAIRING_SESSIONS {
        uuid id PK
        uuid workspace_id FK
        timestamp session_time
    }

    PAIRING_ASSIGNMENTS {
        uuid id PK
        uuid session_id FK
        uuid person_id FK
        uuid board_id FK
    }

    BOARD_TEMPLATES {
        uuid id PK
        uuid workspace_id FK
        string name
        jsonb configuration
    }
```

---

## 2. Key User Journeys

### Journey A: New Team Onboarding
*Goal: A team lead sets up a fresh workspace for their team.*

```mermaid
sequenceDiagram
    participant U as Team Lead
    participant A as Auth (Supabase)
    participant W as Workspace Manager
    participant D as Database

    U->>A: Signs up via Magic Link
    A-->>U: Verify Email & Login
    U->>W: Create "Project Phoenix" Workspace
    W->>D: Insert Workspace & Owner Membership
    U->>W: Add Team Members (Names)
    W->>D: Bulk Insert People
    U->>W: Create Pairing Boards (e.g., "Main", "OOO")
    W->>D: Insert Boards
    U->>W: Move People to Boards
    W->>D: Update App State (Real-time)
```

---

### Journey B: Daily Pairing Rotation (The "Core Loop")
*Goal: Rotate pairs based on recommendations and save history.*

```mermaid
sequenceDiagram
    participant U as Developer
    participant R as Recommender
    participant B as Pairing Board
    participant H as History Service
    participant D as Database

    U->>B: Opens Workspace
    B->>D: Fetches Current Board + History
    U->>R: Clicks "Recommend Pairs"
    R->>R: Analyzes History (Priority on Stale Pairs)
    R-->>B: Proposes New Layout (Optimistic UI)
    U->>B: Fine-tunes (Drag & Drop)
    B->>D: Updates current arrangement (Real-time sync to team)
    U->>H: Clicks "Save Pairing Session"
    H->>D: Records Session + Assignments (Snapshots history)
```

---

### Journey C: Stakeholder Review
*Goal: A manager checks pairing status without logging in.*

```mermaid
sequenceDiagram
    participant M as Stakeholder (Manager)
    participant L as Public/View-Only URL
    participant W as Real-time Service
    participant B as Live Pairing Board

    M->>L: Visits parrit.io/phoenix/view
    L->>W: Subscribes to Phoenix Workspace
    W-->>B: Streams current board layout
    Note over M, B: Stakeholder sees ghost cursors and live movements
    M->>B: Clicks "Meeting Link" on Macaw Board
    B-->>M: Opens Zoom/Teams in new tab
```
