# CLAUDE.md

Project instructions for AI coding agents. These **override** default
behavior.

## Commits & PRs

- **No AI attribution.** Do NOT add any AI co-author or "co-developed
  by" / "generated with" messaging to commit messages, PR/MR bodies, or
  any other artifact. Specifically: **no** `Co-Authored-By: Claude`,
  **no** `Co-authored-by: Sculptor`, and no similar trailers. Use plain
  messages.
- **Conventional Commits.** Use `feat:` / `fix:` / `feat!:` etc. — CI
  uses them to drive versioning and the changelog on merge to `main`.

## Tooling

- Use **`yarn`**, never `npm` (Yarn 4 workspaces monorepo).
