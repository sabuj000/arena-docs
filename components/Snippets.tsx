import { CodeGroup } from './CodeGroup'
import { buildSnippets, type Json } from '../lib/snippets'

// Shows one operation as cURL, TypeScript, Python and PHP, generated from openapi/arena.json.
// Use: <Snippets operation="POST /players" />. Pass body to show a shorter request body.
export function Snippets({ operation, body }: { operation: string; body?: Json }) {
  const snippets = buildSnippets(operation, body)
  return (
    <CodeGroup>
      {snippets.map((snippet) => (
        <pre key={snippet.lang}>
          <code className={`language-${snippet.lang}`}>{snippet.code}</code>
        </pre>
      ))}
    </CodeGroup>
  )
}
