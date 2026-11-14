# Docs toolkit (Arena configuration)

A copy of the docs-as-code toolkit from https://github.com/sabuj000/Portfolio/tree/main/docs-toolkit,
configured for this repo. The original README is in `UPSTREAM-README.md`.

Arena-specific files:
- `project-profile.md` configures the toolkit for Arena (MDX components, spec location, delivery rules).
- `shared/terminology.md` holds Arena terms.
- `templates/api-doc.mdx` is the API operation template in Arena MDX.

## How a docs change flows

1. A request comes in (a ticket, a Slack message, or text). Start at `skills/docs/SKILL.md`.
2. The router picks a skill: `write-api-doc`, `write-user-doc`, `write-release-notes`, `improve-aeo` or `review-doc`.
3. The skill verifies claims against `openapi/arena.json`, drafts MDX, and self-reviews with `shared/quality-checklist.md`.
4. It runs `npm run check`, creates a `docs/<summary>` branch, and opens a pull request with the decision block.
5. GitHub Actions re-runs the checks and Vercel builds a preview. A human reviews and merges.

## Checks

- `npm run check`: links, nav, metadata, and parity between the docs and `openapi/arena.json`.
- `npm run test:seeded`: plants 12 known mistakes in a temporary copy and confirms the checker catches each.
