# Arena API docs

A docs-as-code demo site for **Arena**, a fictional gaming API (players, matches, leaderboards, inventory, achievements and purchases). It contains no real product or company content. The API domain `api.arena.example` is reserved and does not exist.

Live site: https://arena-docs.vercel.app

## Stack

- Next.js (App Router) with `@next/mdx`. No docs framework.
- Pages are MDX files at `app/docs/**/page.mdx`.
- Reusable components in `components/`: `Callout`, `Card`, `CardGroup`, `CodeGroup`, `Endpoint`, `ParamTable`, `Hero`.
- The sidebar and `/llms.txt` are generated from `lib/nav.ts`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Add a page

1. Create `app/docs/<section>/<slug>/page.mdx` with an `export const metadata` block.
2. Add the page to `lib/nav.ts`.
3. Use `ParamTable` for parameter and error tables. Markdown tables are not enabled.

## License

MIT
