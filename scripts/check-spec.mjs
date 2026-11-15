// Compares the API docs to the OpenAPI spec (openapi/arena.json), which is the source of truth.
// Zero dependencies. Run: node scripts/check-spec.mjs
//
// Checks, per documented operation:
//   - the method and path exist in the spec, and every spec operation is documented
//   - request parameters (query and body) match the spec: no phantom, none missing, required flags agree
//   - numeric limits and enum values in descriptions agree with the spec
//   - error codes (and statuses, when a table gives them) match the spec
// And across pages:
//   - JSON examples and "object" tables use only fields the schema defines
//   - state tables list exactly the spec enum values
//   - the webhook event table matches the spec event list
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const ROW = /\{\s*name:\s*'([^']+)'\s*,\s*type:\s*'([^']*)'(?:\s*,\s*required:\s*(true))?\s*,\s*desc:\s*'((?:[^'\\]|\\.)*)'\s*\}/g
const parseTables = (text) =>
  [...text.matchAll(/<ParamTable[\s\S]*?\/>/g)].map((b) =>
    [...b[0].matchAll(ROW)].map((m) => ({ name: m[1], type: m[2], required: m[3] === 'true', desc: m[4] })),
  )
const isErrorTable = (rows) => rows.length > 0 && rows.every((r) => /^\d{3}$/.test(r.type))

// Flatten a request schema into { name: { required, schema } }, expanding arrays of objects as `name[].child`.
function flatten(schema, prefix = '', out = {}) {
  const req = new Set(schema.required || [])
  for (const [k, s] of Object.entries(schema.properties || {})) {
    out[prefix + k] = { required: req.has(k), schema: s }
    if (s.type === 'array' && s.items?.type === 'object') flatten(s.items, `${prefix}${k}[].`, out)
  }
  return out
}

function constraintProblems(name, row, schema) {
  const text = `${row.type} ${row.desc}`
  const bad = []
  for (const key of ['minLength', 'maxLength', 'minimum', 'maximum', 'maxProperties']) {
    if (schema[key] !== undefined && !new RegExp(`\\b${schema[key]}\\b`).test(text)) {
      bad.push(`${name}: description should state ${key} ${schema[key]} (spec) but says "${row.desc}"`)
    }
  }
  if (schema.enum) {
    const present = schema.enum.filter((v) => new RegExp(`\\b${v}\\b`).test(text))
    if (present.length > 0 && present.length < schema.enum.length) {
      const missing = schema.enum.filter((v) => !present.includes(v))
      bad.push(`${name}: description omits enum value(s) ${missing.join(', ')} (spec allows ${schema.enum.join(', ')})`)
    }
  }
  return bad
}

export function checkSpec({ root = process.cwd(), docsDir = 'app/docs', specPath = 'openapi/arena.json' } = {}) {
  const errors = []
  const spec = JSON.parse(readFileSync(join(root, specPath), 'utf8'))
  const files = walk(join(root, docsDir)).filter((f) => f.endsWith(`${sep}page.mdx`))
  const specOps = new Map() // "METHOD /v1/path" -> op
  for (const [p, methods] of Object.entries(spec.paths))
    for (const [m, o] of Object.entries(methods)) specOps.set(`${m.toUpperCase()} /v1${p}`, o)
  const documented = new Set()
  const schemaByObject = Object.fromEntries(
    Object.values(spec.components.schemas).map((s) => [s.properties.object?.const, s]),
  )

  // Every operation needs an x-example that fills its path and matches its body schema.
  for (const [key, op] of specOps) {
    const ex = op['x-example']
    if (!ex) {
      errors.push(`${specPath}: ${key} has no x-example`)
      continue
    }
    for (const name of key.match(/\{\w+\}/g)?.map((x) => x.slice(1, -1)) ?? [])
      if (!ex.path?.[name]) errors.push(`${specPath}: ${key} x-example has no value for {${name}}`)
    const schema = op.requestBody?.content?.['application/json']?.schema
    if (ex.body && schema) {
      const props = schema.properties || {}
      for (const k of Object.keys(ex.body))
        if (!props[k]) errors.push(`${specPath}: ${key} x-example body has "${k}", which the schema does not define`)
      for (const k of schema.required || [])
        if (!(k in ex.body)) errors.push(`${specPath}: ${key} x-example body is missing required "${k}"`)
    }
    if (schema && schema.required?.length && !ex.body) errors.push(`${specPath}: ${key} x-example needs a body`)
  }

  for (const file of files) {
    const rel = relative(root, file)
    const src = readFileSync(file, 'utf8')
    const isApiPage = rel.includes(`${sep}api${sep}`)

    // --- <Snippets> must point at real operations ---
    for (const sm of src.matchAll(/<Snippets\s+operation="([^"]+)"/g)) {
      const [sMethod, sPath] = sm[1].split(' ')
      if (!specOps.has(`${sMethod} /v1${sPath}`)) errors.push(`${rel}: <Snippets operation="${sm[1]}"> is not in the spec`)
    }

    // --- Operation sections (API reference pages only) ---
    if (isApiPage) {
      const parts = src.split(/(?=<Endpoint\b)/).slice(1)
      for (const part of parts) {
        const m = part.match(/<Endpoint\s+method="([A-Z]+)"\s+path="([^"]+)"/)
        if (!m) continue
        const key = `${m[1]} ${m[2]}`
        const section = part.split(/\n## /)[0]
        documented.add(key)
        if (!section.includes(`<Snippets operation="${key.replace(' /v1', ' ')}"`))
          errors.push(`${rel}: ${key} has no <Snippets> example`)
        const op = specOps.get(key)
        if (!op) {
          errors.push(`${rel}: ${key} is documented but is not in the spec`)
          continue
        }
        const tables = parseTables(section)
        const reqTable = tables.find((t) => !isErrorTable(t)) || []
        const errRows = tables.filter(isErrorTable).flat()

        // Expected request params from the spec.
        const expected = {}
        for (const p of op.parameters || []) if (p.in === 'query') expected[p.name] = { required: !!p.required, schema: p.schema }
        const body = op.requestBody?.content?.['application/json']?.schema
        if (body) Object.assign(expected, flatten(body))

        const docNames = new Set(reqTable.map((r) => r.name))
        for (const r of reqTable) {
          const e = expected[r.name]
          if (!e) {
            errors.push(`${rel}: ${key} documents parameter "${r.name}" which is not in the spec`)
            continue
          }
          if (e.required !== r.required)
            errors.push(`${rel}: ${key} parameter "${r.name}" is ${e.required ? 'required' : 'optional'} in the spec but documented as ${r.required ? 'required' : 'optional'}`)
          for (const p of constraintProblems(`${key} parameter "${r.name}"`, r, e.schema)) errors.push(`${rel}: ${p}`)
        }
        for (const name of Object.keys(expected))
          if (!docNames.has(name)) errors.push(`${rel}: ${key} is missing parameter "${name}" that the spec defines`)

        // Error codes: tables give code+status; prose gives code only.
        const proseCodes = [...section.matchAll(/(?:the code|returns) `([a-z]+(?:_[a-z]+)+)`/g)].map((x) => x[1])
        const docCodes = new Set([...errRows.map((r) => r.name), ...proseCodes])
        const specCodes = new Map(op['x-error-codes'].map((c) => [c.code, c.status]))
        for (const c of docCodes) if (!specCodes.has(c)) errors.push(`${rel}: ${key} documents error "${c}" which is not in the spec`)
        for (const c of specCodes.keys()) if (!docCodes.has(c)) errors.push(`${rel}: ${key} does not document error "${c}" from the spec`)
        for (const r of errRows)
          if (specCodes.has(r.name) && String(specCodes.get(r.name)) !== r.type)
            errors.push(`${rel}: ${key} error "${r.name}" is documented as ${r.type} but the spec says ${specCodes.get(r.name)}`)
      }
    }

    // --- Sections keyed by heading: object tables, state tables, event table ---
    for (const sec of src.split(/\n(?=## )/)) {
      const h = (sec.match(/^## (.+)$/m) || [])[1] || ''
      const first = parseTables(sec)[0]
      const objMatch = h.match(/^The (.+) object$/)
      if (objMatch && first) {
        const schema = Object.values(spec.components.schemas).find(
          (s) => s.properties.object?.const === objMatch[1].replace(/ /g, '_'),
        )
        if (schema)
          for (const r of first) {
            const prop = schema.properties[r.name]
            if (!prop) errors.push(`${rel}: "${h}" table lists field "${r.name}" which is not in the spec`)
            else for (const p of constraintProblems(`"${h}" field "${r.name}"`, r, prop)) errors.push(`${rel}: ${p}`)
          }
      }
      const stateMatch = h.match(/^(Match|Purchase) states$/)
      if (stateMatch && first) {
        const want = spec.components.schemas[stateMatch[1]].properties.status.enum
        const got = first.map((r) => r.name)
        if (want.join() !== got.join()) errors.push(`${rel}: "${h}" lists [${got}] but the spec status values are [${want}]`)
      }
      if (h === 'Event types' && first) {
        const got = first.map((r) => r.name)
        const want = spec['x-webhook-events']
        for (const e of want) if (!got.includes(e)) errors.push(`${rel}: webhook event "${e}" is in the spec but not documented`)
        for (const e of got) if (!want.includes(e)) errors.push(`${rel}: webhook event "${e}" is documented but not in the spec`)
      }
    }

    // --- JSON examples: top-level fields must exist in the schema for that object ---
    for (const m of src.matchAll(/```json\n([\s\S]*?)```/g)) {
      let data
      try {
        data = JSON.parse(m[1])
      } catch {
        continue
      }
      const schema = data && typeof data === 'object' ? schemaByObject[data.object] : undefined
      if (!schema) continue
      for (const k of Object.keys(data))
        if (!(k in schema.properties)) errors.push(`${rel}: a "${data.object}" example has field "${k}" which is not in the spec`)
    }
  }

  for (const key of specOps.keys())
    if (!documented.has(key)) errors.push(`openapi: ${key} is in the spec but has no documentation`)
  return errors
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkSpec()
  if (errors.length) {
    console.error(`Spec check failed with ${errors.length} problem(s):\n`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log('Spec check passed: docs match openapi/arena.json.')
}
