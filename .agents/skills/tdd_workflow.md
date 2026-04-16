---
name: tdd_workflow
description: Use for every new implementation, feature, or bug fix. Enforces Red-Green-Refactor with the Vitest + jsdom stack used in this repo.
---

# Skill: TDD Workflow (Red-Green-Refactor)

Use this skill for every new implementation, feature enhancement, or bug fix. No exceptions — including "quick" patches.

## When to Use

- Starting a new feature or sub-component.
- Fixing a bug (requires a regression test).
- Refactoring existing logic to preserve behavior.
- Modifying store slices, hooks, or data fetching logic.

## Do Not Use

- For documentation-only changes.
- For purely aesthetic CSS tweaks with no logic impact.

---

## Workflow

### 1. Preparation

Before writing tests, ensure the environment is ready:

- **Supabase mocks**: All Supabase traffic must be mocked. The global mock in `src/test/setup.ts` mocks `@/lib/supabase`. For store tests, re-mock `../../../lib/supabase` with the specific methods your code calls — including `auth.updateUser` if the store stamps app version.
- **Zustand stores**: Reset store state in `beforeEach` using `useXxxStore.setState({...})` to prevent test bleed.
- **Globals**: `__APP_VERSION__` and `__APP_BUILD_DATE__` are injected by Vite. In tests they may resolve to the npm package version. Account for this in mocks.

### 2. RED: Write a Failing Test

Define the expected behavior before writing any production code.

```bash
# Run only the unit tier (fastest — ~5s)
npm run test:unit

# Run only the component tier (jsdom — ~22s)
npm run test:component

# Run a single file in the relevant tier
npx vitest run --project unit src/features/my/myHelper.test.ts
npx vitest run --project component src/features/my/MyComponent.test.tsx
```

- **Location**: Colocate tests with source (`MyComponent.tsx` → `MyComponent.test.tsx`).
- **Bug fixes**: Write a regression test that reproduces the bug exactly. Document the scenario in a comment.
- **Confirm failure**: The test must fail for the _right_ reason — not an import error or missing mock.

### 3. GREEN: Minimum Implementation

Write the simplest code that makes the test pass.

```bash
npx vitest run src/features/my/MyComponent.test.tsx
```

Focus on correctness, not cleanliness.

### 4. REFACTOR: Clean Up

Clean up while keeping tests green.

```bash
npm run lint
npx tsc --noEmit
```

- Remove all `console.log` statements.
- Ensure TypeScript compiles cleanly — no `any`, no `@ts-ignore`.

### 5. Final Verification

Run the full suite and build before marking the task complete.

```bash
npm run test -- --coverage   # full suite + thresholds (70% lines/statements/branches, 60% functions)
npm run build                # must succeed
```

---

## Test Placement Rules

| Your test needs…                                    | Tier          | File suffix                                                                  |
| --------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| Pure logic, Zustand stores, utils, algorithms       | **unit**      | `.test.ts`                                                                   |
| `render`, `renderHook`, `screen`, `userEvent`       | **component** | `.test.tsx`                                                                  |
| `document`, `window`, `localStorage` without render | **component** | `.test.ts` (add to component `include` + unit `exclude` in `vite.config.ts`) |
| Supabase calls                                      | either        | Mock via `vi.mock(...)`                                                      |

When a `.test.ts` file needs jsdom, add it explicitly to both lists in `vite.config.ts`:

```ts
// unit project — exclude:
'src/store/useThemeStore.test.ts',

// component project — include:
'src/store/useThemeStore.test.ts',
```

## Reference Patterns

- **Render wrapper**: Use `src/test/utils.tsx` `renderWithProviders` if it exists, otherwise wrap with `QueryClientProvider` manually.
- **Store reset**: Always call `useXxxStore.setState({...})` in `beforeEach` with the full initial shape.
- **Mock supabase auth methods**: If the source calls `supabase.auth.updateUser`, `supabase.auth.signOut`, etc., every called method must be present in the mock or you'll get `TypeError: ... is not a function`.

---

> A task is not complete until `npm run test -- --coverage` and `npm run build` both pass cleanly.
