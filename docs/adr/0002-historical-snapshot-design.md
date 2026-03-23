# ADR-0002: Historical Snapshot Design

## 📅 Created: March 3, 2026

## 🎯 Context

Parrit needs to store historical pairing data to:

1. Provide a log of past team configurations.
2. Feed the recommendation engine for "greedy" pair rotations.
3. Allow users to back-date snapshots if they forget to save them during the day.

## ⚖ Decisions

### 1. Two-Table Schema

We chose a normalized two-table approach for history instead of a single JSON blob:

- `pairing_sessions`: Stores the "Session ID", `user_id`, and `session_date` (as a `date` type).
- `pairing_history`: Stores the join between `person_id`, `board_id`, and `session_id`.

**Rationale**: This allows for high-performance SQL queries for pair frequency (e.g., "Find all times Person A and Person B shared a board"). Using JSON blobs would make cross-session analytics significantly slower.

### 2. Native Date Parsing

We chose to explicitly store `session_date` as a native SQL `DATE` (YYYY-MM-DD) and a separate `created_at` timestamp.

- **`session_date`**: The "Business Date" representing when the pairing occurred. Users can manually edit this to fix historical records.
- **`created_at`**: The "System Time" representing when the "Save Session" button was clicked.

### 3. Cascading Deletion

- When a `pairing_sessions` row is deleted, all associated `pairing_history` rows must be automatically removed via Postgres `ON DELETE CASCADE`.

## 🚀 Impact

This design enables the **Pairing Heatmap** and **Individual Insights** to load instantly using indexed relational queries, ensuring the app remains fast as the team grows and history accumulates.
