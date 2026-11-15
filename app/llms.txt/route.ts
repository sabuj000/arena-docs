import { nav } from '../../lib/nav'

const BASE = 'https://arena-docs.vercel.app'

export const dynamic = 'force-static'

export function GET() {
  const lines = [
    '# Arena API',
    '',
    '> Arena is a fictional REST API for ranked matches, leaderboards, inventory and in-game purchases. It exists to demonstrate a docs-as-code workflow and contains no real product content. There is no hosted service, but a demo TypeScript SDK and an in-browser sandbox implement every operation.',
    '',
  ]
  for (const group of nav) {
    lines.push(`## ${group.title}`, '')
    for (const item of group.items) {
      lines.push(`- [${item.title}](${BASE}${item.href})`)
    }
    lines.push('')
  }
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
