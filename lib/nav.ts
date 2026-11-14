// Single source of truth for the Arena docs IA.
// The sidebar renders from this. Later, generate sitemap.xml and llms.txt from it too.

export type NavItem = { title: string; href: string }
export type NavGroup = { title: string; items: NavItem[] }

export const nav: NavGroup[] = [
  {
    title: 'Get started',
    items: [
      { title: 'Quickstart', href: '/docs/get-started/quickstart' },
      { title: 'Authentication', href: '/docs/get-started/authentication' },
      { title: 'Sandbox and test data', href: '/docs/get-started/sandbox' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Run a ranked match end to end', href: '/docs/guides/ranked-match' },
      { title: 'Sell and grant in-game items', href: '/docs/guides/items-and-purchases' },
    ],
  },
  {
    title: 'API reference',
    items: [
      { title: 'Conventions', href: '/docs/api/conventions' },
      { title: 'Players', href: '/docs/api/players' },
      { title: 'Matches', href: '/docs/api/matches' },
      { title: 'Leaderboards', href: '/docs/api/leaderboards' },
      { title: 'Inventory', href: '/docs/api/inventory' },
      { title: 'Achievements', href: '/docs/api/achievements' },
      { title: 'Purchases', href: '/docs/api/purchases' },
    ],
  },
  {
    title: 'More',
    items: [
      { title: 'Webhooks and events', href: '/docs/webhooks' },
      { title: 'SDKs', href: '/docs/sdks' },
      { title: 'Changelog', href: '/docs/changelog' },
    ],
  },
]
