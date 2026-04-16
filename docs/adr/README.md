# Architectural Decision Records

This directory records significant architectural decisions made in the Parrit project.

## What goes here

An ADR captures _why_ a decision was made — the context, alternatives considered, and trade-offs accepted. It is NOT documentation of how something works (that belongs in code comments or context docs). Use ADRs for decisions that:

- Are hard to reverse once implemented
- Have non-obvious trade-offs that future contributors would question
- Choose between two or more genuinely viable alternatives

## File naming

```
NNNN-short-kebab-case-title.md
```

Example: `0001-use-zustand-over-redux.md`

## Template

```markdown
# ADR NNNN: Title

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by ADR-XXXX | Deprecated

## Context

What is the situation that forced a decision?

## Decision

What was decided?

## Alternatives considered

What else was on the table and why was it rejected?

## Consequences

What becomes easier or harder as a result of this decision?
```

## Index

_(Add entries here as ADRs are created)_
