import type { MDXComponents } from 'mdx/types'
import { Hero } from './components/Hero'
import { Card, CardGroup } from './components/Card'
import { CodeBlock } from './components/CodeBlock'
import { CodeGroup } from './components/CodeGroup'
import { Callout } from './components/Callout'
import { Snippets } from './components/Snippets'
import { Endpoint } from './components/Endpoint'
import { ParamTable } from './components/ParamTable'
import { slugify } from './lib/slug'

// Components listed here are available in every .mdx file without importing.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => <h2 id={slugify(children)}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(children)}>{children}</h3>,
    pre: CodeBlock,
    Hero,
    Card,
    CardGroup,
    CodeGroup,
    Callout,
    Endpoint,
    ParamTable,
    Snippets,
    ...components,
  }
}
