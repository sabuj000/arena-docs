import type { ReactNode } from 'react'

// A small syntax highlighter. It has no dependencies and covers the languages used in these docs.

type Rule = { type: string; re: RegExp; prevOk?: (prev: string) => boolean }

const words = (list: string) => new RegExp(`\\b(?:${list.split(' ').join('|')})\\b`, 'y')
const DQ = /"(?:\\.|[^"\\])*"/y
const SQ = /'(?:\\.|[^'\\])*'/y
const TEMPLATE = /`(?:\\.|[^`\\])*`/y
const NUMBER = /\b\d+(?:\.\d+)?\b/y
const startOfWord = (prev: string) => prev === '' || /\s/.test(prev)

const JSON_RULES: Rule[] = [
  { type: 'key', re: /"(?:\\.|[^"\\])*"(?=\s*:)/y },
  { type: 'string', re: DQ },
  { type: 'number', re: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y },
  { type: 'keyword', re: words('true false null') },
]

const SHELL_RULES: Rule[] = [
  { type: 'comment', re: /#.*/y, prevOk: startOfWord },
  { type: 'string', re: DQ },
  { type: 'string', re: SQ },
  { type: 'var', re: /\$\{?[A-Za-z_]\w*\}?/y },
  { type: 'flag', re: /--?[A-Za-z][\w-]*/y, prevOk: startOfWord },
  { type: 'keyword', re: words('curl export echo npm npx cd'), prevOk: startOfWord },
]

const JS_RULES: Rule[] = [
  { type: 'comment', re: /\/\/.*/y },
  { type: 'comment', re: /\/\*[\s\S]*?\*\//y },
  { type: 'string', re: DQ },
  { type: 'string', re: SQ },
  { type: 'string', re: TEMPLATE },
  { type: 'number', re: NUMBER },
  {
    type: 'keyword',
    re: words(
      'const let var function async await return if else for while new throw try catch import from export default class extends typeof of in as interface true false null undefined',
    ),
  },
]

const PYTHON_RULES: Rule[] = [
  { type: 'comment', re: /#.*/y },
  { type: 'string', re: /"""[\s\S]*?"""/y },
  { type: 'string', re: /f?"(?:\\.|[^"\\])*"/y },
  { type: 'string', re: /f?'(?:\\.|[^'\\])*'/y },
  { type: 'number', re: NUMBER },
  {
    type: 'keyword',
    re: words(
      'import from as def return if elif else for while in not and or is with try except raise class lambda pass await async None True False',
    ),
  },
]

const PHP_RULES: Rule[] = [
  { type: 'comment', re: /\/\/.*|#.*/y },
  { type: 'comment', re: /\/\*[\s\S]*?\*\//y },
  { type: 'keyword', re: /<\?php/y },
  { type: 'string', re: DQ },
  { type: 'string', re: SQ },
  { type: 'var', re: /\$[A-Za-z_]\w*/y },
  { type: 'number', re: NUMBER },
  {
    type: 'keyword',
    re: words(
      'function return if else elseif foreach as new array echo use namespace class public private static throw try catch null true false',
    ),
  },
]

const LANGS: Record<string, Rule[]> = {
  json: JSON_RULES,
  jsonc: JSON_RULES,
  bash: SHELL_RULES,
  sh: SHELL_RULES,
  shell: SHELL_RULES,
  curl: SHELL_RULES,
  js: JS_RULES,
  javascript: JS_RULES,
  jsx: JS_RULES,
  ts: JS_RULES,
  typescript: JS_RULES,
  tsx: JS_RULES,
  py: PYTHON_RULES,
  python: PYTHON_RULES,
  php: PHP_RULES,
}

export function highlight(code: string, lang: string): ReactNode[] {
  const rules = LANGS[lang]
  if (!rules) return [code]
  const out: ReactNode[] = []
  let plain = ''
  let key = 0
  let i = 0
  while (i < code.length) {
    let type = ''
    let text = ''
    const prev = i === 0 ? '' : code[i - 1]
    for (const rule of rules) {
      if (rule.prevOk && !rule.prevOk(prev)) continue
      rule.re.lastIndex = i
      const match = rule.re.exec(code)
      if (match && match[0].length > 0) {
        type = rule.type
        text = match[0]
        break
      }
    }
    if (text) {
      if (plain) {
        out.push(plain)
        plain = ''
      }
      out.push(
        <span key={key++} className={`tok-${type}`}>
          {text}
        </span>,
      )
      i += text.length
    } else {
      plain += code[i]
      i += 1
    }
  }
  if (plain) out.push(plain)
  return out
}
