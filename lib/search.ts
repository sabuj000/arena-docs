import type { SearchRecord } from './search-index'

export const OPEN_EVENT = 'arena-search-open'

export type Hit = { record: SearchRecord; score: number; snippet: string }

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

function count(text: string, term: string): number {
  let total = 0
  let at = text.indexOf(term)
  while (at !== -1) {
    total += 1
    at = text.indexOf(term, at + term.length)
  }
  return total
}

function snippetFor(text: string, terms: string[]): string {
  const lower = text.toLowerCase()
  const positions = terms.map((term) => lower.indexOf(term)).filter((position) => position !== -1)
  if (positions.length === 0) return text.length > 150 ? `${text.slice(0, 150)}…` : text
  const start = Math.max(0, Math.min(...positions) - 50)
  const end = Math.min(text.length, start + 150)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

// Every word must appear in the section, its page title or its text. Heading matches rank highest.
export function search(records: SearchRecord[], query: string, limit = 8): Hit[] {
  const terms = tokenize(query)
  if (terms.length === 0) return []
  const hits: Hit[] = []
  for (const record of records) {
    const section = record.section.toLowerCase()
    const page = record.page.toLowerCase()
    const text = record.text.toLowerCase()
    const sectionWords = section.split(/\W+/)
    let score = 0
    let matchesAll = true
    for (const term of terms) {
      let points = 0
      if (section.includes(term)) points += sectionWords.includes(term) ? 12 : 8
      if (page.includes(term)) points += 4
      points += Math.min(count(text, term), 5)
      if (points === 0) {
        matchesAll = false
        break
      }
      score += points
    }
    if (!matchesAll) continue
    if (terms.length > 1 && section.includes(terms.join(' '))) score += 10
    hits.push({ record, score, snippet: snippetFor(record.text, terms) })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
