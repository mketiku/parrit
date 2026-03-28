---
name: code-coverage-improvement
description: Use when the user wants to assess, increase, or enforce automated test coverage in this repository, including establishing a baseline, identifying high-value gaps, prioritizing branch-heavy workflows, and defining threshold and CI enforcement steps.
---

# Code Coverage Improvement

Use this skill when the task is to improve test coverage in a repo rather than just report the current percentage.

## Outcomes

- Establish a trustworthy coverage baseline.
- Identify the highest-value files to test next.
- Increase confidence in critical paths, not just the headline percentage.
- Add or tighten coverage enforcement so regressions fail CI.

## Workflow

1. Inspect coverage generation.
   - Read `package.json`, `vite.config.ts`, and CI workflow files.
   - Confirm the coverage command, provider, exclusions, and whether thresholds exist.
   - Check whether dependencies are installed before assuming a fresh run is possible.

2. Establish the baseline.
   - Prefer a fresh local coverage run.
   - If that is not possible, use the latest artifact in `coverage/` and label it stale if it may not reflect current code.
   - Report statements, branches, functions, and lines.

3. Audit the trustworthiness of the number.
   - Inspect exclusions carefully.
   - Call out whether large UI or workflow areas are excluded.
   - Distinguish untested files from excluded files.

4. Prioritize improvements.
   - Start with low-coverage files that sit on critical user workflows.
   - Prefer branch-heavy components, state slices, hooks, and reducers over static screens.
   - Target files where a small number of tests can unlock many uncovered branches.

5. Choose the testing mix.
   - Unit tests for pure helpers, stores, reducers, and algorithms.
   - Integration tests for UI behavior with mocked services or stores.
   - E2E only for cross-feature or browser-specific flows that cannot be trusted at lower layers.

6. Add enforcement.
   - Add pragmatic baseline thresholds first.
   - Enforce them in the test runner and CI.
   - Ratchet thresholds upward only after the new baseline is stable.

## Heuristics

- Branch coverage is often the best signal for complex UI and state logic.
- A modest global threshold is useful, but per-file targeting matters more for critical flows.
- Do not chase excluded boilerplate before core workflows are covered.
- Favor colocated test files if the repo already uses that convention.

## Coverage Plan Shape

Include:

- current baseline and caveats
- excluded areas that may distort the number
- highest-value files to cover next
- recommended test type for each target
- threshold and CI changes
- final verification commands

## Example Priorities

- Primary workflow containers and state orchestration
- Branch-heavy admin/settings/auth flows
- Store slices and helper logic with meaningful decision trees
- Secondary UI components with important state transitions
