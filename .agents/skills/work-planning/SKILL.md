---
name: work-planning
description: Use when the user wants a reusable execution plan for repository work, including assessing current state, identifying priorities, separating sequential and parallel work, defining agent boundaries, and tracking transient planning notes.
---

# Work Planning

Use this skill when the task is to turn a repo goal into an execution plan that can be carried out by one or more agents.

## Outcomes

- Establish the current state relevant to the task.
- Identify the highest-value work first.
- Separate work into sequential, parallelizable, and delegable tracks.
- Define clear ownership boundaries for agents.
- Persist transient planning notes locally when requested.

## Workflow

1. Inspect the current setup.
   - Read the files that define the area being changed.
   - Check existing automation, tests, CI, or docs that constrain the work.
   - Confirm whether the environment is ready before assuming commands can be run.

2. Establish the baseline.
   - Summarize the current state with concrete facts.
   - Call out blockers, stale artifacts, or assumptions.
   - Distinguish observed facts from inference.

3. Rank the work.
   - Prioritize user-facing risk, complexity, and dependency order.
   - Prefer foundational changes before follow-on cleanup.
   - Group independent work into tracks with disjoint ownership.

4. Produce an execution plan.
   - Sequential:
     - prerequisite setup
     - baseline confirmation
     - foundational changes
     - final integration and verification
   - Parallel:
     - independent implementation or test-writing tracks
     - separate docs, UI, backend, or tooling work when ownership is disjoint
   - Delegable:
     - assign bounded file sets or responsibilities to separate agents
     - keep one owner for integration-sensitive or cross-cutting changes

5. Persist working notes when needed.
   - Store transient notes in `.agents/shared/` if the user asks for local planning artifacts.
   - Keep `.agents/shared/` gitignored without ignoring the whole `.agents/` tree.

## What To Read

- Repo instructions such as `AGENTS.md`
- Files directly relevant to the task
- Existing tests near the target area
- CI or automation config if the task affects verification
- Prior local artifacts only if they materially inform the plan

## Heuristics

- Start with the smallest set of files that establish the true current state.
- Prefer plans that reduce integration risk early.
- Use branch-heavy or stateful code paths as a signal for higher testing priority.
- If automation exists but does not enforce the desired quality bar, recommend enforcement.
- Use colocated changes where the repo already follows that pattern.

## Good Agent Boundaries

- Agent 1: baseline and cross-cutting config
- Agent 2: primary implementation track
- Agent 3: secondary feature or UI track
- Agent 4: tests, helpers, or edge-case coverage

Give each agent a disjoint write set and avoid overlapping ownership.

## Deliverable Shape

Include:

- current baseline with caveats
- highest-value work items
- sequential work
- parallelizable work
- agent/delegation splits
- next verification commands

Keep the answer concise and action-oriented.
