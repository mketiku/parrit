---
name: bug_hunt
description: Use to investigate and fix a bug systematically. Emphasizes root cause analysis before writing any fix.
---

# Skill: Bug Hunt

Use this skill to investigate and fix a bug systematically. The goal is always root cause — not the first plausible explanation.

## When to Use

- A production issue needs diagnosing (broken flows, wrong data, auth failures).
- A bug report came in and the cause isn't obvious from the symptom.
- A fix was applied but the bug persists.
- You're about to patch something but haven't verified _why_ it's broken.

## Do Not Use

- For failing tests during TDD — use `tdd_workflow` instead.

## The Rule

**Never fix before you understand.** If the proposed cause doesn't fully explain all observed symptoms, keep digging.

---

## Step 1: Gather Symptoms

Before touching any code, collect the full picture:

- What exactly is failing? (error message, blank screen, wrong data)
- When did it start? (recent deploy, schema change, dependency update)
- Is it reproducible locally? On staging? Production only?

Check browser console, network tab, and server logs before forming a hypothesis.

---

## Step 2: Investigate — Common Axes

| Axis          | What to look for                                                    |
| ------------- | ------------------------------------------------------------------- |
| **Code path** | Execution order, null checks, async/await gaps, wrong import path   |
| **State**     | Zustand store shape, initial values, missing reset in `beforeEach`  |
| **Mocks**     | Missing method in supabase mock, wrong mock return value            |
| **Types**     | TypeScript errors, `any` escapes hiding mismatches                  |
| **Auth**      | Session missing, token expired, RLS policy blocking                 |
| **Database**  | Schema drift, missing RLS policy, wrong column name                 |
| **Config**    | Missing env var, wrong Supabase URL, VITE\_ prefix missing          |
| **Globals**   | `__APP_VERSION__` or `__APP_BUILD_DATE__` undefined in test context |

```bash
# Check TypeScript errors first — often reveals the issue immediately
npx tsc --noEmit

# Run the specific failing test file in isolation
npx vitest run src/path/to/failing.test.ts
```

---

## Step 3: Validate the Root Cause

Before writing a fix, confirm the diagnosis explains **all** symptoms:

- Does it account for every observed failure mode?
- Does it explain why it works in some cases but not others?
- Can you reproduce the bug with a minimal failing test?

---

## Step 4: Write a Failing Regression Test

Before changing any production code, write a test that reproduces the bug:

```bash
npx vitest run src/path/to/new.test.ts
```

- The test must **fail for the right reason** (not an unrelated error).
- Add a comment documenting the reproduction scenario and root cause.

> See `tdd_workflow` for mock setup and test placement rules.

---

## Step 5: Fix

Write the minimal fix that resolves the root cause.

- Fix at the source, not at the symptom. If a mock is missing a method, add it — don't guard the call in production code.
- Do not add defensive code to mask a bug without fixing the underlying cause.

---

## Step 6: Verify

```bash
# Confirm regression test now passes
npx vitest run src/path/to/fixed.test.ts

# Run full suite to catch regressions
npm run test -- --coverage

# Confirm build is clean
npm run build
```

---

## Escalation

| Symptom                          | Where to look first                                      |
| -------------------------------- | -------------------------------------------------------- |
| Test fails with `not a function` | Supabase mock is missing a method — add `vi.fn()` for it |
| Store state bleeds between tests | Missing `useXxxStore.setState({...})` in `beforeEach`    |
| Build fails after test passes    | TypeScript error in source — run `npx tsc --noEmit`      |
| Auth flow broken                 | Check `useAuthStore` initialization and session handling |
| Supabase query fails             | Check RLS policy, table name in generated types          |

---

> A bug is not fixed until a regression test exists, the full test suite passes, and the exact failing scenario has been verified.
