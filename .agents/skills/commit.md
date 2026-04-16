---
name: commit
description: Use before every git commit or push. Runs the quality gate steps (typecheck, lint, tests) and organizes conventional commits.
---

# Skill: Commit Workflow

Use this skill whenever you're about to commit and push changes.

## When to Use

- Before any `git commit` or `git push`.
- When organizing a changeset across multiple conventional commits.
- After completing a task and the user asks you to commit.

## Do Not Use

- For feature implementation or bug fixing — finish those first, then run this skill.

---

## Steps

### 1. Typecheck

```bash
npx tsc --noEmit
```

Fix all TypeScript errors before proceeding. Do not skip.

### 2. Lint

```bash
npm run lint
```

Fix all lint errors. Never disable rules to make the check pass.

### 3. Tests

```bash
npm run test -- --coverage
```

All tests must pass and thresholds must be met (70% lines/statements/branches, 60% functions). Fix failures — never weaken a test to make it pass.

### 4. Organize Commits

Review staged changes and group into logical, conventional commits:

- `feat(scope): ...` — new functionality
- `fix(scope): ...` — bug fix
- `refactor(scope): ...` — restructuring without behavior change
- `test(scope): ...` — test additions or changes
- `chore(scope): ...` — tooling, config, deps
- `docs(scope): ...` — documentation only

If the changeset spans multiple concerns, present the proposed grouping and wait for confirmation before committing.

### 5. Commit

Use a heredoc to pass the message cleanly:

```bash
git commit -m "$(cat <<'EOF'
type(scope): concise summary (7-14 words)
EOF
)"
```

For non-code changes (docs, ADRs, config only), append `[skip ci]` to avoid a Vercel build:

```bash
git commit -m "docs: update architecture notes [skip ci]"
```

### 6. Push

```bash
git push
```

---

## Rules

- Never use `--no-verify` unless the user explicitly asks.
- Never commit without running typecheck + lint + tests first.
- Never amend a published commit — create a new one.
- Never commit secrets or `.env` files.
