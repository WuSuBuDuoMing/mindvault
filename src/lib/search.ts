/**
 * Search Module
 *
 * Full-text search across conversations, prompts, and code snippets.
 * Uses SQLite LIKE for MVP, can be upgraded to FTS5 later.
 */

import { prisma } from './db'

/**
 * A single search result across any content type.
 */
export interface SearchResult {
  id: string
  type: 'conversation' | 'prompt' | 'code' | 'project'
  title: string
  description: string
  highlight: string
  relevance: number
}

/**
 * Search across all content types (conversations, prompts, code snippets, projects).
 * Requires a query of at least 2 characters. Results are sorted by relevance score.
 *
 * @param query - Search string (minimum 2 characters)
 * @returns Array of {@link SearchResult} sorted by relevance descending
 */
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const searchTerm = `%${query.trim()}%`
  const results: SearchResult[] = []

  // Search conversations
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { title: { contains: query.trim() } },
        { summary: { contains: query.trim() } },
        { keywords: { contains: query.trim() } },
        {
          messages: {
            some: {
              content: { contains: query.trim() },
            },
          },
        },
      ],
    },
    include: {
      messages: {
        where: {
          content: { contains: query.trim() },
        },
        take: 1,
      },
    },
    take: 20,
  })

  for (const conv of conversations) {
    const matchContent = conv.messages[0]?.content || conv.summary || ''
    const highlight = extractHighlight(matchContent, query)

    results.push({
      id: conv.id,
      type: 'conversation',
      title: conv.title,
      description: conv.summary || `${conv.messageCount} messages`,
      highlight,
      relevance: calculateRelevance(conv.title, conv.summary, query),
    })
  }

  // Search prompts
  const prompts = await prisma.promptItem.findMany({
    where: {
      OR: [
        { title: { contains: query.trim() } },
        { content: { contains: query.trim() } },
      ],
    },
    include: {
      conversation: {
        select: { title: true },
      },
    },
    take: 20,
  })

  for (const prompt of prompts) {
    const highlight = extractHighlight(prompt.content, query)

    results.push({
      id: prompt.id,
      type: 'prompt',
      title: prompt.title || 'Untitled Prompt',
      description: `From: ${prompt.conversation.title}`,
      highlight,
      relevance: calculateRelevance(prompt.title, prompt.content, query),
    })
  }

  // Search code snippets
  const codeSnippets = await prisma.codeSnippet.findMany({
    where: {
      OR: [
        { code: { contains: query.trim() } },
        { description: { contains: query.trim() } },
      ],
    },
    include: {
      conversation: {
        select: { title: true },
      },
    },
    take: 20,
  })

  for (const snippet of codeSnippets) {
    const highlight = extractHighlight(snippet.code, query)

    results.push({
      id: snippet.id,
      type: 'code',
      title: snippet.description || `${snippet.language || 'Code'} Snippet`,
      description: `From: ${snippet.conversation.title}`,
      highlight,
      relevance: calculateRelevance(snippet.description, snippet.code, query),
    })
  }

  // Search projects
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query.trim() } },
        { summary: { contains: query.trim() } },
      ],
    },
    take: 20,
  })

  for (const project of projects) {
    const highlight = extractHighlight(project.summary || '', query)

    results.push({
      id: project.id,
      type: 'project',
      title: project.name,
      description: project.category,
      highlight,
      relevance: calculateRelevance(project.name, project.summary, query),
    })
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  return results
}

/**
 * Search only conversations by title and summary. Requires at least 2 characters.
 *
 * @param query - Search string
 * @returns Up to 50 matching conversations ordered by most recently updated
 */
export async function searchConversations(query: string) {
  if (!query || query.trim().length < 2) {
    return []
  }

  return prisma.conversation.findMany({
    where: {
      OR: [
        { title: { contains: query.trim() } },
        { summary: { contains: query.trim() } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })
}

/**
 * Extract a text snippet around the query match for display in search results.
 *
 * @param content - The full content to search within
 * @param query - The search query to locate
 * @returns A substring of up to 100 chars centered on the match, with ellipsis
 */
function extractHighlight(content: string, query: string): string {
  if (!content) return ''

  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) {
    return content.substring(0, 100) + (content.length > 100 ? '...' : '')
  }

  // Get context around the match
  const start = Math.max(0, index - 50)
  const end = Math.min(content.length, index + query.length + 50)
  let highlight = content.substring(start, end)

  if (start > 0) highlight = '...' + highlight
  if (end < content.length) highlight = highlight + '...'

  return highlight
}

/**
 * Calculate a relevance score for a search result based on title and content match quality.
 * Title matches score higher (up to 100 points) than content matches (up to 60 points).
 *
 * @param title - The title to score against
 * @param content - The content body to score against
 * @param query - The search query
 * @returns Numeric relevance score (higher is more relevant)
 */
function calculateRelevance(title: string | null, content: string | null, query: string): number {
  let score = 0
  const lowerQuery = query.toLowerCase()

  // Title match (highest priority)
  if (title) {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle === lowerQuery) {
      score += 100
    } else if (lowerTitle.startsWith(lowerQuery)) {
      score += 80
    } else if (lowerTitle.includes(lowerQuery)) {
      score += 60
    }
  }

  // Content match
  if (content) {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes(lowerQuery)) {
      score += 40

      // Boost for exact word match
      const wordRegex = new RegExp(`\\b${lowerQuery}\\b`, 'i')
      if (wordRegex.test(content)) {
        score += 20
      }
    }
  }

  return score
}
