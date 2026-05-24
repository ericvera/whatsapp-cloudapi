# Task 5.2: Launch the Review agent

## Goal

Spawn `/sculptor-workflow:review` in a new agent tab so the Review agent can
verify requirements coverage, re-run the test suite, and invoke the repo's
code-review skill. This is the final task in the plan.

## Background

This is the last task in the plan. Every feature task is complete and committed;
Task 5.1 confirmed all tests pass. The Review agent reads the spec,
architecture, plan, and the diff to produce `review.md`.

## Files to modify/create

None. This task spawns an agent; it does not edit code.

## Implementation details

1. Compute the diff range. Default: `origin/main...HEAD`. The repo's default
   branch is `main` (per `.sculptor/code.md`); the current feature branch is
   `eric/support-reactions`.
2. Spawn a new agent in the same workspace via the `/sculptor:sculpt-cli` skill,
   invoking `/sculptor-workflow:review` there. Seed it with:
   - `Slug:` cloud-api-latest-parity
   - `Spec path:` .sculptor/specs/cloud-api-latest-parity/spec.md
   - `Architecture path:` .sculptor/specs/cloud-api-latest-parity/architecture.md
   - `Plan folder:` .sculptor/specs/cloud-api-latest-parity/plan
   - `Diff range:` origin/main...HEAD
3. The Review agent self-renames on entry; you do not need to rename it.
4. End this turn with **text instructions** pointing the user to the new Review
   tab. Do NOT call `mcp__sculptor__ask_user_question` (the workspace's
   "waiting for input" state must belong to the Review agent now).

## Verification checklist

- [ ] The Review agent is running in a new tab.
- [ ] Text instructions point the user there.

## Commit policy

**Do NOT commit.** This task does not edit any files. After spawning the Review
agent, report success with no commit.
