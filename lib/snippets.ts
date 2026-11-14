import spec from '../openapi/arena.json'

// Builds request examples in four languages from openapi/arena.json, so the examples cannot drift from the spec.
// Each operation carries an `x-example` with sample path values, query values, an idempotency key and a body.

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
export type Snippet = { lang: string; code: string }

type Example = {
  path?: Record<string, string>
  query?: Record<string, string>
  idempotencyKey?: string
  body?: Json
}
type Operation = { 'x-example'?: Example }

const OPERATIONS = spec.paths as unknown as Record<string, Record<string, Operation>>
const BASE = spec.servers[0].url

function isObject(value: Json): value is { [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type Style = {
  quote: (text: string) => string
  key: (name: string) => string
  separator: string
  open: string
  close: string
  inlinePad: string
  indent: string
  bool: (value: boolean) => string
  nothing: string
}

const jsQuote = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const pyQuote = (text: string) => `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

const JS: Style = {
  quote: jsQuote,
  key: (name) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : jsQuote(name)),
  separator: ': ',
  open: '{',
  close: '}',
  inlinePad: ' ',
  indent: '  ',
  bool: (value) => String(value),
  nothing: 'null',
}
const PYTHON: Style = {
  quote: pyQuote,
  key: pyQuote,
  separator: ': ',
  open: '{',
  close: '}',
  inlinePad: '',
  indent: '    ',
  bool: (value) => (value ? 'True' : 'False'),
  nothing: 'None',
}
const PHP: Style = {
  quote: jsQuote,
  key: jsQuote,
  separator: ' => ',
  open: '[',
  close: ']',
  inlinePad: '',
  indent: '    ',
  bool: (value) => String(value),
  nothing: 'null',
}

// Prints a value as a literal in the target language. Short values stay on one line.
function literal(value: Json, style: Style, level: number): string {
  if (value === null) return style.nothing
  if (typeof value === 'boolean') return style.bool(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return style.quote(value)

  const isList = Array.isArray(value)
  const entries = Array.isArray(value)
    ? value.map((item) => literal(item, style, level + 1))
    : Object.entries(value).map(
        ([name, item]) => `${style.key(name)}${style.separator}${literal(item, style, level + 1)}`,
      )
  const open = isList ? '[' : style.open
  const close = isList ? ']' : style.close
  if (entries.length === 0) return open + close

  const pad = isList ? '' : style.inlinePad
  const inline = `${open}${pad}${entries.join(', ')}${pad}${close}`
  if (!inline.includes('\n') && inline.length <= 60) return inline

  const inner = style.indent.repeat(level + 1)
  const outer = style.indent.repeat(level)
  return `${open}\n${entries.map((entry) => `${inner}${entry},`).join('\n')}\n${outer}${close}`
}

// JSON on one line with a space after commas and colons, as in the shell example.
function oneLine(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(oneLine).join(', ')}]`
  if (isObject(value)) {
    return `{${Object.entries(value)
      .map(([name, item]) => `${JSON.stringify(name)}: ${oneLine(item)}`)
      .join(', ')}}`
  }
  return JSON.stringify(value)
}

export function operationExists(operation: string): boolean {
  const [method, path] = operation.split(' ')
  return Boolean(OPERATIONS[path]?.[method.toLowerCase()])
}

export function buildSnippets(operation: string, bodyOverride?: Json): Snippet[] {
  const [method, template] = operation.split(' ')
  const op = OPERATIONS[template]?.[method.toLowerCase()]
  if (!op) throw new Error(`Snippets: "${operation}" is not in openapi/arena.json`)
  const example = op['x-example'] ?? {}
  const body = bodyOverride ?? example.body

  const path = template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = example.path?.[name]
    if (!value) throw new Error(`Snippets: "${operation}" has no x-example path value for {${name}}`)
    return value
  })
  const query = example.query
    ? `?${Object.entries(example.query)
        .map(([name, value]) => `${name}=${value}`)
        .join('&')}`
    : ''
  const url = `${BASE}${path}${query}`
  const key = example.idempotencyKey

  // cURL
  const showMethod = !(method === 'GET' || (method === 'POST' && body !== undefined))
  const target = query ? `"${url}"` : url
  const curlLines = [`curl ${showMethod ? `-X ${method} ` : ''}${target}`, '  -H "Authorization: Bearer sk_test_YOUR_KEY"']
  if (key) curlLines.push(`  -H "Idempotency-Key: ${key}"`)
  if (body !== undefined) {
    curlLines.push('  -H "Content-Type: application/json"')
    curlLines.push(`  -d '${oneLine(body).replace(/'/g, "'\\''")}'`)
  }
  const curl = curlLines.join(' \\\n')

  // TypeScript
  const tsHeaders = ['    Authorization: `Bearer ${process.env.ARENA_SECRET_KEY}`,']
  if (key) tsHeaders.push(`    'Idempotency-Key': ${jsQuote(key)},`)
  if (body !== undefined) tsHeaders.push("    'Content-Type': 'application/json',")
  const ts = [`const res = await fetch(${jsQuote(url)}, {`]
  if (method !== 'GET') ts.push(`  method: '${method}',`)
  ts.push('  headers: {', ...tsHeaders, '  },')
  if (body !== undefined) ts.push(`  body: JSON.stringify(${literal(body, JS, 1)}),`)
  ts.push('})', 'const data = await res.json()')

  // Python
  const pyHeaders = [`        "Authorization": f"Bearer {os.environ['ARENA_SECRET_KEY']}",`]
  if (key) pyHeaders.push(`        "Idempotency-Key": ${pyQuote(key)},`)
  const py = ['import os', 'import requests', '', `res = requests.${method.toLowerCase()}(`, `    ${pyQuote(url)},`, '    headers={', ...pyHeaders, '    },']
  if (body !== undefined) py.push(`    json=${literal(body, PYTHON, 1)},`)
  py.push('    timeout=10,', ')', 'data = res.json()')

  // PHP
  const phpHeaders = ["        'Authorization: Bearer ' . getenv('ARENA_SECRET_KEY'),"]
  if (key) phpHeaders.push(`        ${jsQuote(`Idempotency-Key: ${key}`)},`)
  if (body !== undefined) phpHeaders.push("        'Content-Type: application/json',")
  const php = ['<?php', `$ch = curl_init(${jsQuote(url)});`, 'curl_setopt_array($ch, [']
  if (method === 'POST') php.push('    CURLOPT_POST => true,')
  else if (method !== 'GET') php.push(`    CURLOPT_CUSTOMREQUEST => '${method}',`)
  php.push('    CURLOPT_RETURNTRANSFER => true,', '    CURLOPT_HTTPHEADER => [', ...phpHeaders, '    ],')
  if (body !== undefined) php.push(`    CURLOPT_POSTFIELDS => json_encode(${literal(body, PHP, 1)}),`)
  php.push(']);', '$data = json_decode(curl_exec($ch), true);', 'curl_close($ch);')

  return [
    { lang: 'bash', code: curl },
    { lang: 'ts', code: ts.join('\n') },
    { lang: 'python', code: py.join('\n') },
    { lang: 'php', code: php.join('\n') },
  ]
}
