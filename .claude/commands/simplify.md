Review recently changed code for quality, reuse, and efficiency — then fix any issues found.

## Instructions

1. Run `git diff HEAD` (or `git diff main...HEAD` for the full branch) to identify all changed files.
2. Read each changed file and evaluate against the project's standards:

### What to look for

**Duplication & reuse**

- Business logic or transformation code duplicated across files
- Inline Supabase query construction that could use an existing helper
- Store selectors copy-pasted instead of shared

**Code quality**

- `console.log`, `console.warn`, or `console.error` left in production code — remove them
- `any` types — replace with named interfaces or `unknown` + type guard
- `useMemo` / `useCallback` added without a proven re-render loop
- Missing `// TODO: regenerate supabase types` comment on `as unknown as MyType` casts

**Correctness**

- Zustand store state mutations outside of `set()` — all state changes must go through `set`
- Missing store state reset in `beforeEach` in test files
- Supabase mock missing a method the source code calls (causes `TypeError: ... is not a function`)
- `vi.mock` factory returning a shape that doesn't match the actual module structure
- Missing `updateUser` in auth mocks when the source calls it

**Structure**

- Feature code reaching into another feature's internals (violates feature isolation)
- Helpers or abstractions created for one-time use — inline instead
- Speculative complexity added beyond what the task required
- New component without a colocated test file

3. Fix all issues found. Preserve behavior — this is cleanup, not a rewrite.
4. Run `npm run lint` and `npx tsc --noEmit` to confirm no regressions.
5. Run `npm run test:unit` to confirm no test breakage.
6. Summarize what was changed and why.
