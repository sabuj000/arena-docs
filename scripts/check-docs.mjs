// Docs quality gate. Zero dependencies. Run: node scripts/check-docs.mjs
// Exits 1 and prints every problem if any check fails.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

// Same slug rule as mdx-components.tsx, so anchors in links match heading ids.
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// 1. Collect pages and routes.
const pageFiles = walk(join(ROOT, 'app')).filter((f) => f.endsWith(`${sep}page.mdx`))
const routeOf = (f) => {
  const r = '/' + relative(join(ROOT, 'app'), f).split(sep).slice(0, -1).join('/')
  return r === '/' ? '/' : r
}
const pages = new Map(pageFiles.map((f) => [routeOf(f), f]))
const routes = new Set([...pages.keys(), '/llms.txt'])

// 2. Nav and pages must match.
const navSrc = readFileSync(join(ROOT, 'lib/nav.ts'), 'utf8')
const navHrefs = [...navSrc.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1])
for (const h of navHrefs) if (!pages.has(h)) fail('lib/nav.ts', `nav links to ${h} but no page.mdx exists there`)
for (const r of pages.keys()) {
  if (r !== '/' && !navHrefs.includes(r)) fail(relative(ROOT, pages.get(r)), `page ${r} is missing from lib/nav.ts`)
}

// 3. Per-page checks.
for (const [route, file] of pages) {
  const rel = relative(ROOT, file)
  const src = readFileSync(file, 'utf8')

  const meta = src.match(/export const metadata\s*=\s*\{([\s\S]*?)\n\}/)
  if (!meta) fail(rel, 'missing `export const metadata`')
  else {
    if (!/title:\s*['"`]/.test(meta[1])) fail(rel, 'metadata is missing a title')
    if (!/description:\s*['"`]/.test(meta[1]) && !/description:\s*\n/.test(meta[1])) fail(rel, 'metadata is missing a description')
  }

  // Markdown tables are not enabled in this build; they render as plain text.
  if (/^\|.*\|\s*\n\|\s*[-:]+/m.test(src)) fail(rel, 'uses a markdown table. Use <ParamTable> instead')

  // Every ParamTable row needs a non-empty description.
  for (const block of src.matchAll(/<ParamTable[\s\S]*?\/>/g)) {
    const names = (block[0].match(/\bname:/g) || []).length
    const descs = [...block[0].matchAll(/\bdesc:\s*'((?:[^'\\]|\\.)*)'/g)].filter((m) => m[1].trim().length > 0).length
    if (names !== descs) fail(rel, `a ParamTable has ${names} rows but ${descs} non-empty descriptions`)
  }

  // Headings (for anchor checks).
  pages.get(route) // keep reference
}

const headingIds = new Map()
for (const [route, file] of pages) {
  const src = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
  headingIds.set(route, new Set([...src.matchAll(/^#{2,3} (.+)$/gm)].map((m) => slugify(m[1]))))
}

// 4. Internal links and anchors must resolve.
for (const [, file] of pages) {
  const rel = relative(ROOT, file)
  const src = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
  const links = [
    ...[...src.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]),
    ...[...src.matchAll(/href=["'](\/[^"']*)["']/g)].map((m) => m[1]),
  ]
  for (const link of links) {
    const [path, anchor] = link.split('#')
    if (!routes.has(path)) fail(rel, `broken link ${link}`)
    else if (anchor && !headingIds.get(path)?.has(anchor)) fail(rel, `anchor #${anchor} not found on ${path}`)
  }
}

if (errors.length) {
  console.error(`Docs check failed with ${errors.length} problem(s):\n`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`Docs check passed: ${pages.size} pages, ${navHrefs.length} nav items.`)
