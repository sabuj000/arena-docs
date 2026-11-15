import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { nav } from './nav'
import { slugifyText } from './slug'

// Builds the search index from the MDX pages at build time. Server only.

export type SearchRecord = {
  url: string // page path, with #anchor when the section has one
  page: string // page title
  section: string // heading text, empty for the page intro
  text: string // plain text of the section
}

const unescape = (text: string) => text.replace(/\\(.)/g, '$1')

// Reduces MDX to plain text. Code blocks are left out. Table rows keep the name and description.
function toPlainText(source: string): string {
  return source
    .replace(/^export const metadata = \{[\s\S]*?\n\}\n/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<ParamTable[\s\S]*?\/>/g, (block) => {
      const rows = [...block.matchAll(/name:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?desc:\s*'((?:[^'\\]|\\.)*)'/g)]
      return `\n${rows.map((row) => `${unescape(row[1])}: ${unescape(row[2])}`).join(' ')}\n`
    })
    .replace(/<Endpoint\s+method="([A-Z]+)"\s+path="([^"]+)"\s*\/>/g, '\n$1 $2\n')
    .replace(/<Hero[\s\S]*?\/>/g, (block) => {
      const title = /title="([^"]*)"/.exec(block)?.[1] ?? ''
      const subtitle = /subtitle="([^"]*)"/.exec(block)?.[1] ?? ''
      return `\n${title}. ${subtitle}\n`
    })
    .replace(/<Snippets[^>]*\/>/g, ' ')
    .replace(/<\/?[A-Z][A-Za-z]*[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function readMeta(source: string, key: 'title' | 'description'): string {
  const match = new RegExp(`${key}:\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`).exec(source)
  return unescape(match?.[1] ?? match?.[2] ?? '')
}

const stripMarkup = (text: string) =>
  text
    .replace(/[`*]/g, '')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*-\s+/, '')
    .trim()

function indexPage(root: string, href: string, file: string): SearchRecord[] {
  const source = readFileSync(join(root, file), 'utf8')
  const page = readMeta(source, 'title') || 'Arena API'
  const description = readMeta(source, 'description')
  const records: SearchRecord[] = []

  let section = ''
  let anchor = ''
  let buffer: string[] = description ? [description] : []
  const flush = () => {
    const text = buffer.join(' ').replace(/\s+/g, ' ').trim()
    if (text || section) records.push({ url: anchor ? `${href}#${anchor}` : href, page, section, text })
    buffer = []
  }

  for (const line of toPlainText(source).split('\n')) {
    const heading = /^(#{1,3})\s+(.+?)\s*$/.exec(line)
    if (!heading) {
      buffer.push(stripMarkup(line))
      continue
    }
    flush()
    if (heading[1] === '#') {
      section = ''
      anchor = ''
    } else {
      section = stripMarkup(heading[2])
      // The site only gives an id to headings that are plain text.
      anchor = /[`*[\]]/.test(heading[2]) ? '' : slugifyText(heading[2])
    }
  }
  flush()
  return records
}

export function buildIndex(root: string = process.cwd()): SearchRecord[] {
  const pages = [{ href: '/', file: 'app/page.mdx' }].concat(
    nav.flatMap((group) => group.items.map((item) => ({ href: item.href, file: `app${item.href}/page.mdx` }))),
  )
  return pages.flatMap((page) => indexPage(root, page.href, page.file))
}
