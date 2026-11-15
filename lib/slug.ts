import type { ReactNode } from 'react'

// Turns "Create a purchase" into "create-a-purchase" so headings can be linked to.
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Headings that are plain text get an id. Headings with inline code or links do not.
export function slugify(children: ReactNode): string | undefined {
  if (typeof children !== 'string') return undefined
  return slugifyText(children)
}
