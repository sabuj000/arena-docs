import { buildIndex } from '../../lib/search-index'

export const dynamic = 'force-static'

// The search index, built from the MDX pages when the site builds.
export function GET() {
  return Response.json(buildIndex())
}
