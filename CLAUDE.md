# Arena docs: agent instructions

This repo is a docs-as-code demo for a fictional API. Docs are MDX in `app/docs/`. The OpenAPI file
`openapi/arena.json` is the source of truth for API behavior.

## For any docs request

1. Read `docs-toolkit/project-profile.md`, then follow `docs-toolkit/skills/docs/SKILL.md`.
2. Verify every API claim against `openapi/arena.json`. If the spec does not say it, mark it `[unverified]`.
3. Use `ParamTable` for tables. Markdown tables are not enabled.
4. Add new pages to `lib/nav.ts`.
5. Run `npm run check` before opening a PR. Run `npm run test:seeded` if you changed the spec or the checker.
6. Branch `docs/<summary>`, open a PR against `main` with the decision block from `docs-toolkit/shared/deliver.md`.

## Rules

- Never merge your own PR.
- Never edit `openapi/arena.json` to make a doc pass. Change it only when the request is an API change.
- An API change also needs a matching PR in `sabuj000/arena-game` (spec copy, `npm run gen:sdk`, sandbox and contract tests). Open it after the docs PR merges. Its CI fails until the copy matches `main` here.
- Arena is fictional. Keep the fictional notices.
