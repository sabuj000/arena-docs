# Arena API docs

A docs-as-code demo site for **Arena**, a fictional gaming API (players, matches, leaderboards, inventory, achievements and purchases). It contains no real product or company content. The API domain `api.arena.example` is reserved and does not exist.

Live site: https://arena-docs.vercel.app

## What this demo shows

Documentation treated as code, with an AI agent in the loop and checks that do not depend on trust.

1. **A request arrives** as a plain-language GitHub issue. See [#4](https://github.com/sabuj000/arena-docs/issues/4).
2. **An agent runs the `docs` skill** from [`docs-toolkit/`](docs-toolkit/). It reads the project profile, writes the page, and verifies claims against `openapi/arena.json`.
3. **A pull request opens** with a decision block: sources, what was verified, what is unverified, and a confidence score. See [#5](https://github.com/sabuj000/arena-docs/pull/5).
4. **A quality gate runs on every PR.** A person reviews and merges. The agent never merges its own work.
5. **The site redeploys** from `main` on Vercel, and `/llms.txt` updates from the same nav file.

### The quality gate

| Check | What it catches |
|---|---|
| `npm run check:docs` | Pages missing from the nav, missing metadata, markdown tables, empty table descriptions, broken links and anchors |
| `npm run check:spec` | Docs that disagree with `openapi/arena.json`: endpoints, parameters, required flags, limits, enums, error codes, webhook events, JSON example keys |
| `npm run test:seeded` | Plants 12 known mistakes in a temporary copy of the docs and confirms the checker catches each one |
| Build | `next build` fails on broken MDX |

### What the numbers mean

The seeded test catches 12 of 12 planted mistakes. I wrote those mistakes, so this proves the checker works. It does not measure how accurate an AI reviewer is. The checker verifies tables, parameters, error codes and JSON examples. It does not read free prose for wrong claims, and the spec has no definitions for idempotency or rate limits, so those pages are checked for structure only.

## Stack

- Next.js (App Router) with `@next/mdx`. No docs framework.
- Pages are MDX files at `app/docs/**/page.mdx`.
- Reusable components in `components/`: `Callout`, `Card`, `CardGroup`, `CodeGroup`, `Endpoint`, `ParamTable`, `Hero`.
- The sidebar and `/llms.txt` are generated from `lib/nav.ts`.
- `openapi/arena.json` is the source of truth for API behavior.
- `docs-toolkit/` holds the agent skills, templates and the Arena project profile. `CLAUDE.md` tells an agent how to raise a docs PR.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Run `npm run check` before you open a PR.

## Add a page

1. Create `app/docs/<section>/<slug>/page.mdx` with an `export const metadata` block.
2. Add the page to `lib/nav.ts`.
3. Use `ParamTable` for parameter and error tables. Markdown tables are not enabled.

## License

MIT
