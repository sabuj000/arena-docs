import { Children, isValidElement, type ReactNode } from 'react'

export type Snippet = { lang: string; code: string }

function flatten(node: ReactNode): string | null {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) {
    const parts = node.map((part) => flatten(part as ReactNode))
    return parts.some((part) => part === null) ? null : parts.join('')
  }
  return null
}

// Reads the language and text from the <code> element that MDX puts inside <pre>.
export function fromCodeElement(node: ReactNode): Snippet | null {
  const element = Children.toArray(node).find((child) => isValidElement(child))
  if (!element || !isValidElement(element)) return null
  const props = element.props as { className?: string; children?: ReactNode }
  const text = flatten(props.children)
  if (text === null) return null
  const match = /language-([\w-]+)/.exec(props.className ?? '')
  return { lang: match ? match[1] : '', code: text.replace(/\n$/, '') }
}

// Reads a snippet from a code block element, such as a child of <CodeGroup>.
export function fromBlockElement(node: ReactNode): Snippet | null {
  if (!isValidElement(node)) return null
  const props = node.props as { children?: ReactNode }
  return fromCodeElement(props.children)
}

// The tab label shown for a snippet.
export function labelFor(snippet: Snippet): string {
  switch (snippet.lang) {
    case 'bash':
    case 'sh':
    case 'shell':
    case 'curl':
      return /\bcurl\b/.test(snippet.code) ? 'cURL' : 'Shell'
    case 'js':
    case 'javascript':
      return 'JavaScript'
    case 'ts':
    case 'typescript':
      return 'TypeScript'
    case 'py':
    case 'python':
      return 'Python'
    case 'php':
      return 'PHP'
    case 'json':
      return 'JSON'
    case 'ruby':
      return 'Ruby'
    case 'go':
      return 'Go'
    case 'java':
      return 'Java'
    case 'csharp':
      return 'C#'
    case '':
      return 'Text'
    default:
      return snippet.lang.charAt(0).toUpperCase() + snippet.lang.slice(1)
  }
}
