#!/usr/bin/env node
/**
 * Hook orchestration script — mirrors CI steps locally.
 *
 * Usage:
 *   node scripts/run-hook-checks.mjs pre-commit   (~20s: lint-staged + unit tests)
 *   node scripts/run-hook-checks.mjs pre-push     (~90s: lint + typecheck + all tests + coverage)
 */

import { execSync } from 'child_process';

const hook = process.argv[2];

const STEPS = {
  'pre-commit': [
    { name: 'lint-staged', cmd: 'npx lint-staged' },
    { name: 'unit tests', cmd: 'npm run test:unit' },
  ],
  'pre-push': [
    { name: 'lint', cmd: 'npm run lint' },
    { name: 'typecheck', cmd: 'npm run typecheck' },
    { name: 'tests + coverage', cmd: 'npm run test -- --coverage' },
  ],
};

const steps = STEPS[hook];

if (!steps) {
  console.error(`Unknown hook: "${hook}". Expected "pre-commit" or "pre-push".`);
  process.exit(1);
}

let failed = false;

for (const step of steps) {
  process.stdout.write(`\n▶ ${step.name}...\n`);
  try {
    execSync(step.cmd, { stdio: 'inherit' });
    process.stdout.write(`✓ ${step.name}\n`);
  } catch {
    process.stderr.write(`✗ ${step.name} failed\n`);
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
}
