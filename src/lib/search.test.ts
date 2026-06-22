import { describe, it } from 'node:test'
import assert from 'node:assert'

/**
 * Inline copies of pure search functions (buildFuzzyRegex, highlightQuery,
 * calculateRelevance, extractHighlight, buildStatistics) for testing without db dependency.
 * These tests verify the pure function logic without Prisma imports.
 */
function buildFuzzyRegex(query: string): RegExp {
  const words = query.trim().split(/\s+/)

  const patterns = words.map((word) => {
    const tokens = [...word].map((ch) =>
      ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    const fuzzy = tokens.join('.{0,1}')
    return fuzzy
  })

  const combined = patterns.map((p) => `(${p})`).join('.*')
  return new RegExp(combined, 'i')
}

function highlightQuery(text: string, query: string): string {
  if (!text || !query) return text || ''
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

interface SearchResult {
  id: string
  type: 'conversation' | 'prompt' | 'code' | 'project'
  title: string
  description: string
  highlight: string
  relevance: number
}

interface SearchStatistics {
  totalResults: number
  byType: Record<string, number>
  averageRelevance: number
  durationMs: number
}

function buildStatistics(results: SearchResult[], durationMs: number): SearchStatistics {
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

function calculateRelevance(title: string | null, content: string | null, query: string): number {
  let score = 0
  const lowerQuery = query.toLowerCase()

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

  if (content) {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes(lowerQuery)) {
      score += 40
    }
  }

  return score
}

function extractHighlight(content: string, query: string): string {
  if (!content) return ''

  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) {
    return content.substring(0, 120) + (content.length > 120 ? '...' : '')
  }

  const start = Math.max(0, index - 60)
  const end = Math.min(content.length, index + query.length + 60)
  let highlight = content.substring(start, end)

  if (start > 0) highlight = '...' + highlight
  if (end < content.length) highlight = highlight + '...'

  return highlight
}

describe('buildFuzzyRegex', () => {
  it('should match exact strings', () => {
    const regex = buildFuzzyRegex('hello')
    assert.ok(regex.test('hello'))
    assert.ok(regex.test('say hello world'))
  })

  it('should match with inserted characters (fuzzy tolerance)', () => {
    const regex = buildFuzzyRegex('helo')
    assert.ok(regex.test('hello'))
    assert.ok(regex.test('say hello world'))
    assert.ok(!regex.test('xyzabc'))
  })

  it('should handle multi-word queries', () => {
    const regex = buildFuzzyRegex('hello world')
    assert.ok(regex.test('hello world'))
    assert.ok(regex.test('hello wonderful world'))
  })

  it('should be case insensitive', () => {
    const regex = buildFuzzyRegex('Hello')
    assert.ok(regex.test('hello'))
    assert.ok(regex.test('HELLO'))
  })

  it('should escape special regex characters', () => {
    const regex = buildFuzzyRegex('hello.world')
    assert.ok(regex.test('hello.world'))
    assert.ok(!regex.test('helloXworld'))
  })

  it('should handle single character queries', () => {
    const regex = buildFuzzyRegex('a')
    assert.ok(regex.test('a'))
    assert.ok(regex.test('abc'))
  })

  it('should not match completely different strings', () => {
    const regex = buildFuzzyRegex('search')
    assert.ok(!regex.test('xyzabc'))
    assert.ok(!regex.test(''))
  })

  it('should handle empty-ish queries', () => {
    const regex = buildFuzzyRegex('test')
    assert.ok(regex.test('test'))
    assert.ok(regex.test('a test here'))
  })
})

describe('highlightQuery', () => {
  it('should wrap matching text with <mark> tags', () => {
    const result = highlightQuery('Hello World', 'world')
    assert.strictEqual(result, 'Hello <mark>World</mark>')
  })

  it('should be case insensitive', () => {
    const result = highlightQuery('TypeScript is great', 'typescript')
    assert.strictEqual(result, '<mark>TypeScript</mark> is great')
  })

  it('should highlight all occurrences', () => {
    const result = highlightQuery('test this test that test', 'test')
    assert.strictEqual(result, '<mark>test</mark> this <mark>test</mark> that <mark>test</mark>')
  })

  it('should return original text when no match', () => {
    const result = highlightQuery('Hello World', 'xyz')
    assert.strictEqual(result, 'Hello World')
  })

  it('should handle empty input', () => {
    assert.strictEqual(highlightQuery('', 'test'), '')
    assert.strictEqual(highlightQuery('text', ''), 'text')
  })

  it('should escape special regex chars in query', () => {
    const result = highlightQuery('price is $5.00 (USD)', '$5.00')
    assert.strictEqual(result, 'price is <mark>$5.00</mark> (USD)')
  })
})

describe('calculateRelevance', () => {
  it('should give max score for exact title match', () => {
    assert.strictEqual(calculateRelevance('React', '', 'react'), 100)
    assert.strictEqual(calculateRelevance('React', '', 'React'), 100)
  })

  it('should give high score for title starts-with', () => {
    assert.strictEqual(calculateRelevance('React Hooks Guide', '', 'react'), 80)
  })

  it('should give medium score for title contains', () => {
    assert.strictEqual(calculateRelevance('Guide to React', '', 'react'), 60)
  })

  it('should give content score for content match', () => {
    assert.strictEqual(calculateRelevance(null, 'using react hooks', 'react'), 40)
  })

  it('should combine title and content scores', () => {
    const score = calculateRelevance('React Guide', 'using react hooks', 'react')
    assert.strictEqual(score, 120) // 80 (starts-with title) + 40 (content)
  })

  it('should return 0 for no match', () => {
    assert.strictEqual(calculateRelevance('Python', 'django framework', 'react'), 0)
  })

  it('should handle null values gracefully', () => {
    assert.strictEqual(calculateRelevance(null, null, 'test'), 0)
  })
})

describe('extractHighlight', () => {
  it('should extract context around the match', () => {
    const content = 'This is a long text that contains the word react somewhere in the middle of the content'
    const highlight = extractHighlight(content, 'react')
    assert.ok(highlight.includes('react'))
  })

  it('should return first 120 chars if no match found', () => {
    const content = 'This text does not contain the query at all'
    const highlight = extractHighlight(content, 'xyz')
    assert.strictEqual(highlight, content)
  })

  it('should handle empty content', () => {
    assert.strictEqual(extractHighlight('', 'test'), '')
  })

  it('should add ellipsis for partial content', () => {
    const content = 'A'.repeat(200) + 'match' + 'B'.repeat(200)
    const highlight = extractHighlight(content, 'match')
    assert.ok(highlight.includes('match'))
    assert.ok(highlight.startsWith('...'))
    assert.ok(highlight.endsWith('...'))
  })

  it('should not add leading ellipsis if match is at start', () => {
    const highlight = extractHighlight('react is great', 'react')
    assert.ok(highlight.startsWith('react'))
  })
})

describe('buildStatistics', () => {
  it('should return zero stats for empty results', () => {
    const stats = buildStatistics([], 50)
    assert.strictEqual(stats.totalResults, 0)
    assert.deepStrictEqual(stats.byType, {})
    assert.strictEqual(stats.averageRelevance, 0)
    assert.strictEqual(stats.durationMs, 50)
  })

  it('should aggregate results by type', () => {
    const results: SearchResult[] = [
      { id: '1', type: 'conversation', title: 'A', description: '', highlight: '', relevance: 80 },
      { id: '2', type: 'conversation', title: 'B', description: '', highlight: '', relevance: 60 },
      { id: '3', type: 'prompt', title: 'C', description: '', highlight: '', relevance: 40 },
      { id: '4', type: 'code', title: 'D', description: '', highlight: '', relevance: 20 },
    ]
    const stats = buildStatistics(results, 100)
    assert.strictEqual(stats.totalResults, 4)
    assert.strictEqual(stats.byType['conversation'], 2)
    assert.strictEqual(stats.byType['prompt'], 1)
    assert.strictEqual(stats.byType['code'], 1)
    assert.strictEqual(stats.averageRelevance, 50)
    assert.strictEqual(stats.durationMs, 100)
  })

  it('should calculate correct average relevance', () => {
    const results: SearchResult[] = [
      { id: '1', type: 'project', title: 'A', description: '', highlight: '', relevance: 100 },
      { id: '2', type: 'project', title: 'B', description: '', highlight: '', relevance: 0 },
    ]
    const stats = buildStatistics(results, 10)
    assert.strictEqual(stats.averageRelevance, 50)
  })
})
