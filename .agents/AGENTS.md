# Parrit Engineering Standards (React, TypeScript, Supabase)

This guide defines the architectural and code quality standards for the **Parrit** repository. Adherence ensures a "premium" experience, high performance, and long-term maintainability.

## 1. Architectural Integrity (Feature-First)
- **Feature Isolation**: Organize code by feature (e.g., `src/features/auth`, `src/features/pairing`). Each feature encapsulates its own logic, components, and hooks.
- **Public API**: Features should expose a clean interface via an `index.ts`. Avoid deep-linking into another feature's internals.
- **Dependency Flow**: 
    - `src/components/ui`: Atomic, reusable UI components (Shadcn/Base).
    - `src/hooks`: General-purpose hooks.
    - `src/lib`: External client configurations (Supabase, QueryClient).
    - `src/features`: Business logic and complex UI modules.
- **Strict Typing**: Use TypeScript for all code. Avoid `any` at all costs. Use `zod` for runtime validation if needed.

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

## 4. Premium UI/UX (Tailwind CSS v4)
- **Aesthetics**: Follow the "Glassmorphism" design system—use subtle blurs, borders, and high-quality shadows. Avoid generic colors; use the project's curated HSL palette.
- **Animations**: Use **Framer Motion** for micro-interactions and page transitions to make the app feel "alive."
- **Accessibility (A11y)**: Use semantic HTML and ARIA attributes. Test with keyboard navigation. All interactive components should be built on Radix UI primitives (via Shadcn).

## 5. Workflow & Automation
- **Test-Driven Development (TDD)**:
    - Use **Vitest** for unit tests, especially for the pairing recommendation engine.
    - Use **Playwright** for End-to-End (E2E) testing of critical user journeys.
- **Formatting**: Code MUST be formatted with Prettier and linted with ESLint before any push. Run `npm run lint`.
- **Clean Commits**: Follow the conventional commits specification (`feat:`, `fix:`, `chore:`, etc.).

## 6. Implementation Workflow
1.  **Define Types**: Start by outlining the TypeScript interfaces for the new feature or data model.
2.  **Schema Alignment**: Update the Supabase schema and regenerate types if database changes are required.
3.  **Logic First**: Implement and test core business logic (e.g., algorithms) using Vitest.
4.  **UI Crafting**: Build specific UI components with Tailwind, focusing on responsiveness and accessibility.
5.  **Integration**: Connect UI to Supabase using TanStack Query hooks.
6.  **Verify**: Run all tests and the build command (`npm run build`) to ensure project health.
