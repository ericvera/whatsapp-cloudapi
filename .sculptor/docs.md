# Docs

Locations and operational config for the sculptor-workflow skills.
Document structure (spec sections, architecture sections, mock
conventions, plan layout) is baked into the skills — not configured
here.

## Spec Location

- **Path pattern:** `.sculptor/specs/<slug>/spec.md`
- Directory-per-spec: architecture and the plan folder live alongside
  the spec, i.e. `.sculptor/specs/<slug>/architecture.md` and
  `.sculptor/specs/<slug>/plan/`.

## UI Reference

<!--
  Optional: tell the `/sculptor-workflow:mock` skill how to match your app's
  visual style.
-->

Standalone backend/library project — no UI to match. The packages are
TypeScript libraries (`types`, `client`), an Express-based API emulator
(`emulator`), and a headless CLI (`cli`). Mocks are not applicable here.

## Code Review

When `/sculptor-workflow:review` runs at the end of the workflow, it
invokes the configured skill for the code-review pass.

<!--
  Set this to your repo's review skill, e.g. /code-review-checklist
  or /review-react. If left empty, /review skips the code-review pass
  and only verifies requirements coverage and tests.
-->

Skill:
