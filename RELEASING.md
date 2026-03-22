# 🚀 Releasing Parrit

This project uses a semi-automated tagging process to ensure that only stable, tested code reaches production.

## 1. Prerequisites

- You must be on the `main` branch.
- Your working directory must be clean (`git status`).
- You must have the latest changes from origin (`git pull`).

## 2. Release Commands

We provide two primary commands based on the scope of your changes:

### **Patch Release** (Bug fixes, small tweaks)

```bash
npm run release:patch
```

_Effect: `v1.0.0` → `v1.0.1`_

### **Minor Release** (New features, non-breaking changes)

```bash
npm run release:minor
```

_Effect: `v1.0.0` → `v1.1.0`_

## 3. What happens under the hood?

When you run a release command, the following automated steps occur:

1.  **Pre-check**: Runs `npm run lint` and `npm run test`. If **any** test fails, the release is aborted to prevent broken tags.
2.  **Version Bump**: Updates the version in `package.json`.
3.  **Git Tag**: Creates a new git tag matching the version (e.g., `v1.0.1`) with an automated commit message.
4.  **Push**: Automatically pushes the new commit and the new tag to origin.

## 4. Best Practices

- **Test Coverage**: Ensure you've checked the current coverage (`npm run test -- --coverage`) before tagging. We aim for high coverage on core pairing and auth logic.
- **Pull Requests**: Always merge into `main` via a PR. Once the PR is merged, run the release command from your local `main` branch.
