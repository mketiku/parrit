---
name: validation
description: Use for proactive pre-commit/pre-push validation, or to diagnose a failing CI check or git hook.
---

# Skill: Validation

Use this skill for proactive pre-commit/pre-push validation, or to diagnose and fix a failing hook or CI check.

## When to Use

- Before a commit or push to confirm the branch is healthy.
- After CI rejects a push — to isolate and fix the failing step.
- When you want a quick confidence check on the current state.

## Do Not Use

- For feature implementation or bug fixing.

---

## How Hooks Work

The pre-push hook (`.husky/pre-push`) runs:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test -- --coverage`
4. `npm run build`

Each step must pass. The hook will reject the push if any step fails.

---

## Proactive Validation

Run these steps manually before committing or pushing:

```bash
# 1. Lint
npm run lint

# 2. Typecheck
npx tsc --noEmit

# 3. Tests + coverage thresholds
npm run test -- --coverage

# 4. Build
npm run build
```

---

## Diagnosing a CI Failure

When a hook or CI check rejects, isolate the broken step:

```bash
# Lint only
npm run lint

# Typecheck only
npx tsc --noEmit

# Tests without coverage (faster feedback during diagnosis)
npm run test

# Tests with coverage thresholds (what CI runs)
npm run test -- --coverage
```

---

## Escalation

| Failure            | Fix                                                           |
| ------------------ | ------------------------------------------------------------- |
| Lint error         | `npm run lint` — fix manually or auto-fix where possible      |
| Type error         | Fix the code. Never use `any` or `@ts-ignore`                 |
| Test failure       | Fix the code — never weaken a test to make it pass            |
| Coverage below 70% | Use the `code-coverage-improvement` skill to identify gaps    |
| Build failure      | Usually a type error surfaced only by the bundler — run `tsc` |

Bypassing the pre-push hook with `--no-verify` requires explicit user consent and is always temporary.
