---
name: commit-bullets
description: >
  Generate git commit messages with a bulleted or numbered body instead of prose paragraphs.
  Triggers include: "write a commit message", "commit message with bullet points", "commit
  message with numbers", "/commit-bullets", or any request for a commit message that lists
  changes point by point rather than as flowing paragraphs. Use in place of paragraph-style
  commit bodies whenever the user wants a scannable list of what changed.
---

# Commit Bullets

Generate a Conventional Commits message whose body is a bullet (or numbered) list, never a
paragraph.

## Rules

**Subject line:**

- `<type>(<scope>): <imperative summary>` — scope is REQUIRED, never bare `<type>:`
- Pick scope from the dominant area touched: a package/module name, `scaffold` for
  whole-project bootstrap commits, or the top-level dir most changes live under
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: "add", "fix", "remove" — not "added"/"adds"
- ≤50 chars when possible, hard cap 72, no trailing period

**Body — always bullets, never prose:**

- One line per distinct change, `-` prefix (or `1.`/`2.` if the user asked for numbers)
- Each bullet starts with an imperative verb: Add, Fix, Wire, Remove, Rename, Bump
- Group related files under one bullet instead of one bullet per file
- Order: most important / most impactful change first
- Wrap each bullet at ~72 chars; split into a sub-bullet (indented `-`) rather than run long
- Skip a bullet for anything self-evident from the subject line alone
- End with `Closes #N` / `Refs #N` as its own line if applicable

**Never:**

- A paragraph of connected sentences in the body
- "This commit does X", "I", "we", "now", "currently"
- AI attribution lines mixed into the bullets (Co-authored-by trailer stays separate, added by
  the caller — this skill only produces the message)
- Emoji unless the project already uses them

## Example

Diff: initial project scaffold — layouts, Hono API, Drizzle schema, husky hooks, skill docs

```
feat(scaffold): add Next.js + Hono + Neon enterprise project

- Add route-group layouts: auth, marketing, protected (dashboard/global), public
- Mount Hono API at /api with health, auth, error/response/validator helpers
- Add Drizzle schema, Neon db client, and env validation
- Add SEO helpers (JSON-LD), theme toggle, shadcn button, cache tags
- Add .gitkeep placeholders for feature-module dirs used by new-feature/backend-resource skills
- Add husky pre-commit/pre-push/commit-msg hooks with lint-staged and commitlint
```

## Boundaries

Only generates the message text as a code block. Does not stage files, run `git commit`, or
amend. If the user wants numbered instead of dashed bullets, switch the marker but keep every
other rule.
