/**
 * Search Module
 *
 * Full-text search across conversations, prompts, and code snippets.
 * Supports fuzzy matching, tag filtering, time range filtering,
 * search result highlighting with statistics, and result caching.
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
 * Detailed result including matched field metadata for advanced UIs.
 */
export interface DetailedSearchResult extends SearchResult {
  /** Which field(s) matched the query (e.g. "title", "content", "tags"). */
  matchedFields: string[]
  /** Timestamp of the matched item. */
  updatedAt: Date
}

/**
 * Advanced search options for filtering and scoping results.
 */
export interface SearchOptions {
  /** Content types to include (defaults to all types) */
  types?: ('conversation' | 'prompt' | 'code' | 'project')[]
  /** Filter by tag names (conversations only) */
  tags?: string[]
  /** Only include results created after this date */
  dateFrom?: Date
  /** Only include results created before this date */
  dateTo?: Date
  /** Maximum results per content type (default 20) */
  limit?: number
  /** Enable fuzzy matching for tolerance of typos (default false) */
  fuzzy?: boolean
  /** Return detailed results with matched field info (default false) */
  detailed?: boolean
  /** Highlight matched terms in results (default true) */
  highlight?: boolean
}

/**
 * Aggregated statistics about a set of search results.
 */
export interface SearchStatistics {
  /** Total number of results across all types */
  totalResults: number
  /** Breakdown of results by content type */
  byType: Record<string, number>
  /** The average relevance score of returned results */
  averageRelevance: number
  /** Time taken for the search in milliseconds */
  durationMs: number
}

/**
 * Response envelope for search results with metadata.
 */
export interface SearchResponse {
  /** The matched results sorted by relevance */
  results: SearchResult[]
  /** Aggregated statistics about the results */
  statistics: SearchStatistics
}

/**
 * In-memory cache for recent searches to avoid redundant DB queries.
 * Simple LRU-like cache with TTL expiry (5 minutes).
 */
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_SIZE = 50

/**
 * Build a cache key from search parameters.
 */
function buildCacheKey(query: string, options: SearchOptions): string {
  const { types, tags, dateFrom, dateTo, limit, fuzzy } = options
  return JSON.stringify({
    q: query.trim().toLowerCase(),
    types: types?.sort(),
    tags: tags?.sort(),
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
    limit,
    fuzzy,
  })
}

/**
 * Evict expired entries and enforce the max cache size.
 */
function evictCache(): void {
  const now = Date.now()
  for (const [key, entry] of searchCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      searchCache.delete(key)
    }
  }
  // Enforce max size by removing oldest entries
  while (searchCache.size > MAX_CACHE_SIZE) {
    const oldest = searchCache.keys().next().value
    if (oldest !== undefined) searchCache.delete(oldest)
  }
}

/**
 * Build a fuzzy regex pattern from a query string.
 * Inserts `.` character class between each character to allow single-character mismatches.
 * For multi-word queries, each word is fuzzy-matched independently.
 *
 * @param query - The raw search query
 * @returns A RegExp that tolerates minor typos
 */
export function buildFuzzyRegex(query: string): RegExp {
  const words = query.trim().split(/\s+/)

  const patterns = words.map((word) => {
    // Escape each character individually so we get atomic tokens
    const tokens = [...word].map((ch) =>
      ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    // Insert .{0,1} between each token for fuzzy tolerance
    const fuzzy = tokens.join('.{0,1}')
    return fuzzy
  })

  // Each word must appear (in order), with optional gaps
  const combined = patterns.map((p) => `(${p})`).join('.*')
  return new RegExp(combined, 'i')
}

/**
 * Calculate a fuzzy match score: returns a value between 0 and 1
 * indicating how closely the text matches the query.
 *
 * @param text - The text to match against
 * @param fuzzyRegex - The compiled fuzzy regex
 * @returns Match quality score (0 = no match, 1 = perfect)
 */
export function fuzzyMatchScore(text: string, fuzzyRegex: RegExp): number {
  const match = text.match(fuzzyRegex)
  if (!match) return 0
  // Score based on how close the match length is to the query length
  const matchLen = match[0].length
  const queryLen = fuzzyRegex.source.replace(/[^a-zA-Z0-9]/g, '').length
  if (queryLen === 0) return 0.5
  return Math.min(1, queryLen / matchLen)
}

/**
 * Search across all content types (conversations, prompts, code snippets, projects)
 * with support for fuzzy matching, tag filtering, date range filtering, and result caching.
 * Requires a query of at least 2 characters. Results are sorted by relevance score.
 *
 * @param query - Search string (minimum 2 characters)
 * @param options - Optional filters for types, tags, dates, fuzzy, detailed mode, and caching
 * @returns A {@link SearchResponse} with results and aggregated statistics
 */
export async function searchAll(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return {
      results: [],
      statistics: buildStatistics([], 0),
    }
  }

  const cacheKey = buildCacheKey(query, options)
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const startTime = Date.now()

  const {
    types,
    tags,
    dateFrom,
    dateTo,
    limit = 20,
    fuzzy = false,
    detailed = false,
  } = options

  const trimmedQuery = query.trim()
  const searchTerm = `%${trimmedQuery}%`
  const fuzzyRegex = fuzzy ? buildFuzzyRegex(trimmedQuery) : null
  const results: SearchResult[] = []

  const shouldSearch = (type: string) => !types || types.includes(type as any)

  // Build date filter for conversations
  const dateFilter: any = {}
  if (dateFrom) dateFilter.gte = dateFrom
  if (dateTo) dateFilter.lte = dateTo
  const hasDateFilter = dateFrom || dateTo

  // Build tag filter for conversations
  const tagFilter: any = tags && tags.length > 0
    ? {
        tags: {
          some: {
            tag: {
              name: { in: tags.map((t) => t.toLowerCase().trim()) },
            },
          },
        },
      }
    : {}

  // Search conversations
  if (shouldSearch('conversation')) {
    const whereClause: any = {
      OR: [
        { title: { contains: trimmedQuery } },
        { summary: { contains: trimmedQuery } },
        { keywords: { contains: trimmedQuery } },
        {
          messages: {
            some: {
              content: { contains: trimmedQuery },
            },
          },
        },
      ],
      ...tagFilter,
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        messages: {
          where: { content: { contains: trimmedQuery } },
          take: 1,
        },
        tags: {
          include: { tag: true },
        },
      },
      take: limit,
    })

    for (const conv of conversations) {
      const matchContent = conv.messages[0]?.content || conv.summary || ''
      const highlight = extractHighlight(matchContent, trimmedQuery)
      let relevance = calculateRelevance(conv.title, conv.summary, trimmedQuery)
      const matchedFields = detectMatchedFields(trimmedQuery, {
        title: conv.title,
        summary: conv.summary,
        keywords: conv.keywords,
        hasMessageMatch: conv.messages.length > 0,
      })

      // Fuzzy bonus: boost if fuzzy regex matches but exact didn't
      if (fuzzy && relevance === 0 && fuzzyRegex) {
        const fScore = fuzzyMatchScore(conv.title + ' ' + (conv.summary || ''), fuzzyRegex)
        relevance = Math.round(fScore * 60)
      }

      if (relevance > 0 || (!fuzzy && conv.messages.length > 0)) {
        const convTags = conv.tags.map((ct) => ct.tag.name)
        const base: SearchResult = {
          id: conv.id,
          type: 'conversation',
          title: conv.title,
          description: convTags.length > 0
            ? `Tags: ${convTags.join(', ')} | ${conv.summary || `${conv.messageCount} messages`}`
            : conv.summary || `${conv.messageCount} messages`,
          highlight,
          relevance: relevance + (convTags.length > 0 ? 5 : 0), // Tag-boost for tagged items
        }
        if (detailed) {
          (base as DetailedSearchResult).matchedFields = matchedFields
          ;(base as DetailedSearchResult).updatedAt = conv.updatedAt
        }
        results.push(base)
      }
    }
  }

  // Search prompts
  if (shouldSearch('prompt')) {
    const prompts = await prisma.promptItem.findMany({
      where: {
        OR: [
          { title: { contains: trimmedQuery } },
          { content: { contains: trimmedQuery } },
          { tags: { contains: trimmedQuery } },
        ],
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        conversation: {
          select: { title: true },
        },
      },
      take: limit,
    })

    for (const prompt of prompts) {
      const highlight = extractHighlight(prompt.content, trimmedQuery)
      let relevance = calculateRelevance(prompt.title, prompt.content, trimmedQuery)
      const matchedFields = detectMatchedFields(trimmedQuery, {
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags,
      })

      if (fuzzy && relevance === 0 && fuzzyRegex) {
        const fScore = fuzzyMatchScore(prompt.title + ' ' + prompt.content, fuzzyRegex)
        relevance = Math.round(fScore * 60)
      }

      if (relevance > 0 || !fuzzy) {
        const base: SearchResult = {
          id: prompt.id,
          type: 'prompt',
          title: prompt.title || 'Untitled Prompt',
          description: `From: ${prompt.conversation.title}`,
          highlight,
          relevance,
        }
        if (detailed) {
          (base as DetailedSearchResult).matchedFields = matchedFields
          ;(base as DetailedSearchResult).updatedAt = prompt.createdAt
        }
        results.push(base)
      }
    }
  }

  // Search code snippets
  if (shouldSearch('code')) {
    const codeSnippets = await prisma.codeSnippet.findMany({
      where: {
        OR: [
          { code: { contains: trimmedQuery } },
          { description: { contains: trimmedQuery } },
          { language: { contains: trimmedQuery } },
        ],
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        conversation: {
          select: { title: true },
        },
      },
      take: limit,
    })

    for (const snippet of codeSnippets) {
      const highlight = extractHighlight(snippet.code, trimmedQuery)
      let relevance = calculateRelevance(snippet.description, snippet.code, trimmedQuery)
      const matchedFields = detectMatchedFields(trimmedQuery, {
        description: snippet.description,
        code: snippet.code,
        language: snippet.language,
      })

      if (fuzzy && relevance === 0 && fuzzyRegex) {
        const fScore = fuzzyMatchScore(snippet.description + ' ' + snippet.code, fuzzyRegex)
        relevance = Math.round(fScore * 60)
      }

      if (relevance > 0 || !fuzzy) {
        const base: SearchResult = {
          id: snippet.id,
          type: 'code',
          title: snippet.description || `${snippet.language || 'Code'} Snippet`,
          description: `From: ${snippet.conversation.title}`,
          highlight,
          relevance,
        }
        if (detailed) {
          (base as DetailedSearchResult).matchedFields = matchedFields
          ;(base as DetailedSearchResult).updatedAt = snippet.createdAt
        }
        results.push(base)
      }
    }
  }

  // Search projects
  if (shouldSearch('project')) {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: trimmedQuery } },
          { summary: { contains: trimmedQuery } },
          { category: { contains: trimmedQuery } },
        ],
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
      },
      take: limit,
    })

    for (const project of projects) {
      const highlight = extractHighlight(project.summary || '', trimmedQuery)
      let relevance = calculateRelevance(project.name, project.summary, trimmedQuery)
      const matchedFields = detectMatchedFields(trimmedQuery, {
        name: project.name,
        summary: project.summary,
        category: project.category,
      })

      if (fuzzy && relevance === 0 && fuzzyRegex) {
        const fScore = fuzzyMatchScore(project.name + ' ' + (project.summary || ''), fuzzyRegex)
        relevance = Math.round(fScore * 60)
      }

      if (relevance > 0 || !fuzzy) {
        const base: SearchResult = {
          id: project.id,
          type: 'project',
          title: project.name,
          description: project.category,
          highlight,
          relevance,
        }
        if (detailed) {
          (base as DetailedSearchResult).matchedFields = matchedFields
          ;(base as DetailedSearchResult).updatedAt = project.updatedAt
        }
        results.push(base)
      }
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  const durationMs = Date.now() - startTime
  const statistics = buildStatistics(results, durationMs)

  const response: SearchResponse = { results, statistics }

  // Cache the result
  searchCache.set(cacheKey, { data: response, timestamp: Date.now() })
  evictCache()

  return response
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
 * Detect which fields matched the query in a search result.
 *
 * @param query - The search query
 * @param fields - A map of field names to their string values
 * @returns Array of matched field names
 */
function detectMatchedFields(
  query: string,
  fields: Record<string, string | null | undefined | boolean>
): string[] {
  const matched: string[] = []
  const lowerQuery = query.toLowerCase()

  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'boolean') {
      if (value) matched.push(name)
    } else if (value && value.toLowerCase().includes(lowerQuery)) {
      matched.push(name)
    }
  }

  return matched
}

/**
 * Wrap query occurrences in a string with `<mark>` tags for visual highlighting.
 * Returns the original text if the query is empty.
 *
 * @param text - The text to highlight within
 * @param query - The query string to wrap
 * @returns Text with `<mark>` tags around matches
 */
export function highlightQuery(text: string, query: string): string {
  if (!text || !query) return text || ''

  // Escape special regex characters in the query
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Extract a text snippet around the query match for display in search results.
 * Returns a substring of up to 100 chars centered on the match, with ellipsis.
 *
 * @param content - The full content to search within
 * @param query - The search query to locate
 * @returns A substring of up to 120 chars centered on the match, with ellipsis
 */
export function extractHighlight(content: string, query: string): string {
  if (!content) return ''

  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) {
    return content.substring(0, 120) + (content.length > 120 ? '...' : '')
  }

  // Get context around the match (expanded from 50 to 60 chars for better context)
  const contextSize = 60
  const start = Math.max(0, index - contextSize)
  const end = Math.min(content.length, index + query.length + contextSize)
  let highlight = content.substring(start, end)

  if (start > 0) highlight = '...' + highlight
  if (end < content.length) highlight = highlight + '...'

  return highlight
}

/**
 * Build aggregated statistics from a set of search results.
 *
 * @param results - Array of search results
 * @param durationMs - Time taken for the search in milliseconds
 * @returns Aggregated {@link SearchStatistics}
 */
export function buildStatistics(results: SearchResult[], durationMs: number): SearchStatistics {
  const byType: Record<string, number> = {}
  let totalRelevance = 0

  for (const result of results) {
    byType[result.type] = (byType[result.type] || 0) + 1
    totalRelevance += result.relevance
  }

  return {
    totalResults: results.length,
    byType,
    averageRelevance: results.length > 0 ? Math.round(totalRelevance / results.length) : 0,
    durationMs,
  }
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
export function calculateRelevance(title: string | null, content: string | null, query: string): number {
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
      const wordRegex = new RegExp(`\\b${escapeRegExp(lowerQuery)}\\b`, 'i')
      if (wordRegex.test(content)) {
        score += 20
      }
    }
  }

  return score
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Clear the search result cache (useful for testing or after data mutations).
 */
export function clearSearchCache(): void {
  searchCache.clear()
}
