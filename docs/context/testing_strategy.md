# Testing Strategy: Parrit

This document outlines the testing architecture and coverage for the Parrit pairing application.

## 🏁 Testing Philosophy

Parrit prioritizes **Logic Correctness** (algorithm) and **Data Integrity** (Supabase interactions). The project uses a multi-layered testing approach:

1.  **Unit Tests (Vitest)**: Fast, non-browser tests for core mathematical and logic functions.
2.  **Integration Tests (Testing Library)**: Verifies that UI components interact correctly with stores and mock API layers.
3.  **End-to-End Tests (Playwright)**: Full browser-based user flows (Auth, Drag & Drop, Deployment).

---

## 🏗 Key Inspected Areas

### 🖥 Logic & Stores

- **`pairingLogic.ts`**: Verifies the "greedy" recommendation engine. Ensures it respects exempt/locked boards and breaks pairs correctly based on history.
- **`usePairingStore.ts`**: Verifies state transitions for people/boards and proper error handling for Supabase operations.
- **`useTutorialStore.ts`**: Verifies step-by-step navigation for onboarding tours.
- **`useStalePairsDetector.ts`**: Verifies detection of repeat pairs based on historical thresholds.

### 🧪 Hooks & Analytics

- **`useHistoryAnalytics.ts`**: Verifies complex data transformation (flattening Supabase history into a pairing matrix and individual stats).

### 🖼 Components & Interactions

- **`HistoryScreen.tsx`**: Verifies that users can load, edit, and delete snapshots. **Critical Case**: Ensures that if Row Level Security (RLS) blocks a save, a proper error toast is shown.
- **`TemplateManager.tsx`**: Verifies saving the current board state as a template and applying existing templates to current boards.
- **`PairingMatrixView.tsx`**: Verifies that the heatmap correctly represents the pairing counts and scales color intensity.

---

## 🚀 Mocking Strategy (Supabase)

To avoid side effects and dependency on a live backend during unit/integration tests, we use a robust **Supabase Mocking Pattern** in `vitest`:

```typescript
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(), // Critical for multi-row history queries
      maybeSingle: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled)
      ),
    })),
  },
}));
```

## 🛠 Running Tests

```bash
# Run all unit and integration tests
npm run test

# Run E2E tests
npm run test:e2e
```
