# Parrit Engineering Standards (React, TypeScript, Supabase)

This guide defines the architectural and code quality standards for the **Parrit** repository. Adherence ensures a "premium" experience, high performance, and long-term maintainability.

## General Guidelines

- **Stay in scope**: Do not implement changes beyond what was explicitly requested. Surface limitations, trade-offs, and improvement opportunities as commentary — not unilateral code changes. Wait for approval before acting on them.
- **Check before asking**: Before asking a clarifying question, search the codebase for existing patterns, configs, and conventions. The answer is usually already there.
- **Plan before implementing**: When asked to create a plan, produce it first and wait for approval before writing code.
- **Never weaken tests**: If a test is failing, fix the code — not the test. Never remove assertions or reduce thresholds to make CI pass.
- **No console logs**: Remove all `console.log`/`warn`/`error` before committing. Errors that users should never see should fail loudly, not silently.

## Decision Drivers

- Quality is non-negotiable — better small and excellent than large and mediocre.
- Feature decisions optimize for the Parrit product vision, not compatibility with external conventions.
- Tech stack choices are the product owner's call.
- Prefer designs that preserve reasonable vendor portability. Isolate vendor-specific code behind clear local interfaces.

## 1. Architectural Integrity (Feature-First)

- **Feature Isolation**: Organize code by feature (e.g., `src/features/auth`, `src/features/pairing`). Each feature encapsulates its own logic, components, and hooks.
- **Public API**: Features should expose a clean interface via an `index.ts`. Avoid deep-linking into another feature's internals.
- **Dependency Flow**:
  - `src/components/ui`: Atomic, reusable UI components (Shadcn/Base).
  - `src/hooks`: General-purpose hooks.
  - `src/lib`: External client configurations (Supabase, QueryClient).
  - `src/features`: Business logic and complex UI modules.
- **Strict Typing**: Use TypeScript for all code. Avoid `any` at all costs. The `@typescript-eslint/no-explicit-any` rule is enforced — `any` is a lint error, not just a style concern. Always check compilation (`npx tsc --noEmit`) before completion.
  - **When a third-party type is missing** (e.g. a Supabase table not yet in the generated types): use a narrowing cast via `unknown` — `(value as unknown as MyType)` — and leave a `// TODO: regenerate supabase types` comment so the cast is obviously temporary. Do not use `as any` or `// eslint-disable`.
  - **When you genuinely cannot type a value**: define a named `interface` or `type` for it rather than reaching for `any`. If the only option is to escape the type system, use `unknown` and narrow with a type guard.
  - **When Supabase `.from()` rejects a table name**: the table is not in the generated types. Regenerate types with `npx supabase gen types typescript --local > src/types/supabase-generated.ts` rather than suppressing the error.
  - **Type Integrity**: Never remove referenced types/stubs without checking all dependents. Use `zod` for runtime validation if needed.

## 2. React Excellence (Version 19+)

- **Hooks-First**: Use functional components and custom hooks for logic reuse.
- **State Management**:
  - **Server State**: Use **TanStack Query** for all data fetching, caching, and mutations. Leverage optimistic updates for a "snappy" UI.
  - **Global State**: Use **Zustand** for light-weight client-side state (e.g., UI preferences, current workspace context).
  - **Local State**: Use `useState` or `useReducer` for component-isolated state.
- **Composition**: Prefer component composition over "prop drilling" to keep components decoupled and testable.
- **Performance**: Leverage React 19's optimizations. Use `useMemo` and `useCallback` judiciously for expensive computations or to stabilize references for heavy downstream components.

## 3. Supabase & Database Integrity

- **Security (RLS)**: Row Level Security is NOT optional. Every table must have policies that restrict access based on `auth.uid()` or workspace membership.
- **Type Generation**: Run `supabase gen types typescript` whenever the schema changes. Use these types for all database interactions.
- **Real-time Sync**: Use Supabase Realtime for collaborative features (e.g., live pairing board updates). Handle race conditions gracefully using optimistic UI patterns.
- **PostgreSQL Logic**: Business rules that impact data integrity should be enforced at the database level via constraints, triggers, or RPC functions.

### Migration Workflow

1. **Always write a migration file** — never execute raw SQL directly. Every schema change must live in `supabase/migrations/<timestamp>_<description>.sql`.
2. **Apply locally first** — run `npm run db:reset` to verify the migration applies cleanly against the local database before touching production.
3. **Get user approval before pushing to prod** — present the migration file and confirm the user is ready before running `supabase db push`. Never push to production autonomously.

## 4. Premium UI/UX (Tailwind CSS v4)

- **Aesthetics**: Follow the "Glassmorphism" design system — use subtle blurs, borders, and high-quality shadows. Avoid generic colors; use the project's curated HSL palette.
- **Animations**: Use **Framer Motion** for micro-interactions and page transitions to make the app feel "alive."
- **Accessibility (A11y)**: Use semantic HTML and ARIA attributes. Test with keyboard navigation. All interactive components should be built on Radix UI primitives (via Shadcn).

## 5. Testing & Quality

- **TDD by Default**: Red-Green-Refactor for every implementation and bug fix — no exceptions, including "quick" fixes. Write a failing test first, confirm it fails for the right reason, then implement. See `.agents/skills/tdd_workflow.md` for the full workflow.
- **Regression Tests**: Every bug fix MUST include a test that fails before and passes after. Document the reproduction scenario in a comment.
- **Tiered Test Projects** (`vite.config.ts`): Run the narrowest tier first for fast feedback.
  - `npm run test:unit` (~5s) — pure Node, no DOM. Store slices, utils, helpers, algorithms.
  - `npm run test:component` (~22s) — jsdom. Component rendering, `renderHook`, anything touching `window`/`document`.
  - `npm run test -- --coverage` — full suite + thresholds. Run before every push.
  - **Tier placement**: use `unit` if the test doesn't need a DOM. Only add to `component` if it renders, uses `renderHook`, or touches `document`/`window`. If a `.test.ts` file needs jsdom, add it to the `exclude` list in the unit project and the `include` list in the component project in `vite.config.ts`.
- **Coverage Thresholds**: 70% lines/statements/branches, 60% functions (enforced in `vite.config.ts`).
- **Mock Discipline**:
  - Mock all Supabase traffic — never make real network calls in tests.
  - When mocking `supabase.auth`, include _every_ method the source code calls (`getSession`, `onAuthStateChange`, `signOut`, `updateUser`, etc.). A missing method causes `TypeError: ... is not a function`.
  - Reset Zustand store state in `beforeEach` using `useXxxStore.setState({...})` to prevent test bleed.
  - Use `vi.stubEnv` for environment-dependent logic. Never assume default env state.
- **E2E (Playwright)**: For critical user journeys that cannot be trusted at the unit level. Run with `npm run test:e2e`. Not part of git hooks — run selectively when user flows change.

## 6. Workflow & Automation

- **Formatting**: Code MUST be formatted with Prettier and linted with ESLint before any push. Run `npm run lint`.
- **Pre-push gate**: Lint → typecheck → tests + coverage → build. All must pass. See `.agents/skills/validation.md`.
- **Clean Commits**: Follow the **Conventional Commits** specification:
  - `feat`: new feature for the user
  - `fix`: bug fix for the user
  - `docs`: documentation changes
  - `style`: formatting only; no production code change
  - `refactor`: refactoring production code, no behavior change
  - `test`: adding or fixing tests; no production code change
  - `chore`: tooling, config, deps
  - Example: `feat(pairing): add bulk move functionality` or `fix(auth): resolve session timeout on mobile`
- **Skip CI for non-code changes**: Append `[skip ci]` to commit messages when pushing docs, ADRs, or any change that doesn't affect the running app. This prevents a Vercel build from firing unnecessarily.
  - Examples: `docs: update architecture notes [skip ci]`, `chore: update AGENTS.md [skip ci]`

## 7. Implementation Workflow

1. **Define Types**: Start by outlining the TypeScript interfaces for the new feature or data model.
2. **Schema Alignment**: Update the Supabase schema and regenerate types if database changes are required.
3. **Logic First**: Implement and test core business logic (e.g., algorithms) using Vitest.
4. **UI Crafting**: Build specific UI components with Tailwind, focusing on responsiveness and accessibility.
5. **Integration**: Connect UI to Supabase using TanStack Query hooks.
6. **Verify**: Run `npm run test -- --coverage` and `npm run build` to ensure project health.

## 8. Workspace and Drag-and-Drop

- **Workspace UI**: Keep the Pairing Workspace unified. All active and exempt boards reside in the main grid for visibility.
- **Drag and Drop**: Dnd-kit is used for dragging people across boards. Always ensure `DndContext` and `DragOverlay` are correctly structured, and verify state modifications (e.g. `handleBulkMove`) apply immediately.
- **Multi-select**: Utilize `Cmd/Ctrl` modifiers for multiple selections. Ensure batch actions (like "Move to Board") are fully tested.

## 9. Git Branching Strategy

- **Feature Branches**: `feature/[issue-number]-[brief-description]` (e.g., `feature/12-add-social-login`)
- **Bugfix Branches**: `bugfix/[issue-number]-[brief-description]` (e.g., `bugfix/38-fix-pwa-drift`)
- **Release Branches**: `release/[version]` (e.g., `release/1.2.0`)
- **Hotfix Branches**: `hotfix/[issue-number]-[brief-description]`
- Always create a new branch from `main` before starting work.
- Merge back into `main` via a Pull Request once CI checks pass.

## 10. Communication

- **Design questions**: Discuss first, don't jump to code.
- **Bug fixes**: Investigate and fix root causes. Never weaken tests to pass. Never remove functionality to avoid errors.
- **Consultative**: When asked for feedback, respond with discussion ONLY until explicitly asked to implement.

## 11. Skills & Deep Context

Agents should use `.agents/skills/` for workflow guidance.

### Skills (`.agents/skills/`)

| Skill                       | When to use                                          |
| --------------------------- | ---------------------------------------------------- |
| `tdd_workflow`              | Every implementation, feature, or bug fix            |
| `commit`                    | Before every `git commit` or `git push`              |
| `bug_hunt`                  | Diagnosing any bug — broken flows, test failures     |
| `validation`                | Pre-push checks, diagnosing hook or CI failures      |
| `work-planning`             | Turning a repo goal into a structured execution plan |
| `code-coverage-improvement` | Assessing and improving test coverage                |
