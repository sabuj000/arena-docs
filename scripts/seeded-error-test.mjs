// Seeded-error accuracy test.
// Plants known mistakes into a temporary copy of the docs, runs the spec check, and reports
// how many were caught. Fails (exit 1) if the clean docs are not clean, or any planted error is missed.
// Run: node scripts/seeded-error-test.mjs
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkSpec } from './check-spec.mjs'

// Each mutation: a unique file, the exact text to find, the replacement, and a pattern the report must match.
const mutations = [
  { id: 'wrong-enum-value', file: 'api/matches', find: "desc: 'ranked or casual.' },\n    { name: 'max_players', type: 'integer', required: true", to: "desc: 'ranked or friendly.' },\n    { name: 'max_players', type: 'integer', required: true", expect: /omits enum value\(s\) casual/ },
  { id: 'wrong-numeric-limit', file: 'api/inventory', find: 'How many to add, from 1 to 1000.', to: 'How many to add, from 1 to 500.', expect: /maximum 1000/ },
  { id: 'phantom-parameter', file: 'api/players', find: "{ name: 'metadata', type: 'object', desc: 'Up to 20 string key-value pairs.' },\n  ]}\n/>\n\n<CodeGroup>", to: "{ name: 'metadata', type: 'object', desc: 'Up to 20 string key-value pairs.' },\n    { name: 'region', type: 'string', desc: 'The home region.' },\n  ]}\n/>\n\n<CodeGroup>", expect: /parameter "region" which is not in the spec/ },
  { id: 'required-flag-removed', file: 'api/players', find: "name: 'display_name', type: 'string', required: true, desc: 'The public name. 3 to 24 characters.'", to: "name: 'display_name', type: 'string', desc: 'The public name. 3 to 24 characters.'", expect: /"display_name" is required in the spec but documented as optional/ },
  { id: 'wrong-error-status', file: 'api/players', find: "{ name: 'display_name_taken', type: '409'", to: "{ name: 'display_name_taken', type: '422'", expect: /display_name_taken" is documented as 422 but the spec says 409/ },
  { id: 'phantom-response-field', file: 'api/players', find: '  "status": "active",\n  "metadata": { "region": "ap-south" },\n  "created_at": "2026-11-14T10:00:00Z"\n}\n```\n\n<ParamTable', to: '  "status": "active",\n  "level": 5,\n  "metadata": { "region": "ap-south" },\n  "created_at": "2026-11-14T10:00:00Z"\n}\n```\n\n<ParamTable', expect: /field "level" which is not in the spec/ },
  { id: 'wrong-endpoint-path', file: 'api/matches', find: 'path="/v1/matches/{match_id}/cancel"', to: 'path="/v1/matches/{match_id}/abort"', expect: /abort.*not in the spec/ },
  { id: 'wrong-http-method', file: 'api/players', find: '<Endpoint method="DELETE" path="/v1/players/{player_id}" />', to: '<Endpoint method="POST" path="/v1/players/{player_id}" />', expect: /POST \/v1\/players\/\{player_id\} is documented but is not in the spec/ },
  { id: 'undocumented-webhook-event', file: 'webhooks', find: "    { name: 'purchase.refunded', type: 'event', desc: 'A purchase was refunded.' },\n", to: '', expect: /event "purchase.refunded" is in the spec but not documented/ },
  { id: 'phantom-error-code', file: 'api/purchases', find: "{ name: 'purchase_not_refundable', type: '409', desc: 'The purchase is not succeeded, or it is older than 14 days.' },", to: "{ name: 'purchase_not_refundable', type: '409', desc: 'The purchase is not succeeded, or it is older than 14 days.' },\n    { name: 'purchase_expired', type: '409', desc: 'The refund window closed.' },", expect: /error "purchase_expired" which is not in the spec/ },
  { id: 'wrong-page-size', file: 'api/players', find: "{ name: 'limit', type: 'integer', desc: 'Objects per page, 1 to 100. The default is 25.' },", to: "{ name: 'limit', type: 'integer', desc: 'Objects per page, 1 to 250. The default is 25.' },", expect: /maximum 100/ },
  { id: 'wrong-state-list', file: 'api/purchases', find: "    { name: 'failed', type: 'state', desc: 'Payment did not go through. Nothing was granted.' },\n", to: '', expect: /Purchase states" lists/ },
]

const root = process.cwd()
const baseline = checkSpec({ root })
if (baseline.length) {
  console.error('Baseline is not clean, so the test is not meaningful:')
  for (const e of baseline) console.error(`  - ${e}`)
  process.exit(1)
}

let caught = 0
const missed = []
for (const m of mutations) {
  const tmp = mkdtempSync(join(tmpdir(), 'arena-seed-'))
  cpSync(join(root, 'app/docs'), join(tmp, 'app/docs'), { recursive: true })
  cpSync(join(root, 'openapi'), join(tmp, 'openapi'), { recursive: true })
  const file = join(tmp, 'app/docs', m.file, 'page.mdx')
  const text = readFileSync(file, 'utf8')
  if (text.split(m.find).length !== 2) {
    console.error(`Test setup problem: "${m.id}" pattern is not found exactly once in ${m.file}`)
    process.exit(2)
  }
  writeFileSync(file, text.replace(m.find, () => m.to))
  const found = checkSpec({ root: tmp })
  rmSync(tmp, { recursive: true, force: true })
  const hit = found.some((e) => m.expect.test(e))
  console.log(`${hit ? 'caught ' : 'MISSED '} ${m.id}`)
  if (hit) caught++
  else missed.push(m.id)
}

console.log(`\nSeeded-error test: caught ${caught} of ${mutations.length}.`)
if (missed.length) process.exit(1)
