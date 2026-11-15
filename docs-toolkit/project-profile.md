# Project Profile: Arena API docs

Config read first by every skill in `docs-toolkit/`. This is a fictional product used to demonstrate the
toolkit. It contains no real company content.

## Product & audience
- **Product name:** Arena (always "Arena", never "ARENA" or "the Arena")
- **One-line description:** A fictional REST API for ranked matches, leaderboards, inventory, achievements and in-game purchases.
- **Primary reader:** Game developers integrating the API from a game server.
- **Docs base URL:** https://arena-docs.vercel.app

## Docs repository (docs-as-code)
- **Repo:** https://github.com/sabuj000/arena-docs  ·  **Content path:** `app/docs/**/page.mdx` (homepage is `app/page.mdx`)
- **Format:** MDX with project components  ·  **PR base branch:** `main`
- **Link & asset rules:** Internal links are absolute paths such as `/docs/api/players#create-a-player`. Heading anchors are the lowercase, hyphenated heading text. Every new page must be added to `lib/nav.ts`. There are no images yet.

## Sources of truth ("second SME")
- **Primary (originates the doc):** The request, ticket or SME text supplied with each task.
- **API spec (API docs):** `openapi/arena.json`. It is the source of truth for operations, parameters, required flags, limits, enums, error codes and webhook events. If the spec and the request disagree, flag it. Never edit the spec to match a doc unless the request is explicitly an API change.
- **Code / implementation:** no hosted backend. The demo sandbox in `sabuj000/arena-game` (`sandbox/`) implements the API in the browser, and its contract tests check it against `openapi/arena.json`. Treat it as a second source when the spec is silent, and mark such claims `[unverified]` if only the sandbox shows them.
- **Product UI:** none.

## Components & metadata
- **Format:** MDX with these components, available in every page without imports:

  | Purpose | Component | Plain-Markdown fallback |
  |---|---|---|
  | Note / tip / warning | `<Callout type="note\|tip\|warning">` | `> **Note:** …` |
  | Parameter, field, error or state table | `<ParamTable rows={[{ name, type, required?, desc }]} />` | pipe table |
  | Endpoint line | `<Endpoint method="POST" path="/v1/players" />` | `` `POST /v1/players` `` |
  | Code blocks side by side | `<CodeGroup>` around fenced blocks | consecutive fenced blocks |
  | Link cards | `<CardGroup cols={2}><Card title href>…</Card></CardGroup>` | bullet list of links |

- **Markdown tables are not enabled** in this build. Use `ParamTable` for every table. A markdown table renders as plain text.
- **Page metadata (replaces frontmatter):** each page starts with
  `export const metadata = { title: '…', description: '…' }`. Both fields are required. Titles are sentence case.
- **Comment syntax:** `{/* … */}`. Never HTML comments.
- **Metadata for AI:** the description states what the page covers and when to use it. The site publishes `/llms.txt`, generated from `lib/nav.ts`.
- **ParamTable rules:** `desc` is never empty. State numeric limits ("from 1 to 100") and every enum value in the description, using the same wording as the spec. Error rows use the HTTP status as `type`.

## House style
- **Base style guide:** `shared/style-guide.md`  ·  **English variant:** US  ·  **UI verbs:** none (API only)
- **Terminology file:** `shared/terminology.md`
- **Voice:** plain, direct, present tense. Lead with what the operation does. Examples use `sk_test_YOUR_KEY` and fictional IDs (`plr_123`, `mch_77`).
- **Banned words:** seamless, powerful, robust, leverage, easily.

## Delivery
- **Deliver by:** open a pull request against `main`.
- **Branch name:** `docs/<kebab-case-summary>`.
- **Commit message:** imperative, under 72 characters, for example `Document the cancel match error codes`.
- **Before opening the PR, run and pass:** `npm run check` (links, nav, metadata, spec parity). If the change touches the spec, also run `npm run test:seeded`.
- **Registering pages:** add new pages to `lib/nav.ts`. Add API changes to `openapi/arena.json` in the same PR, then update every page the change affects.
- **PR description:** starts with the decision block from `shared/deliver.md`, with Sources set to `openapi/arena.json` plus the request.
- **Review model:** the owner reviews. "Done" means the Action is green and the Vercel preview renders the page.

## Guardrails
- Arena is fictional. Never present it as real, and keep the fictional notice on the homepage, SDKs page and changelog.
- Never add real company names, customer data, or internal URLs.
- Reserved example domain only: `api.arena.example`.
