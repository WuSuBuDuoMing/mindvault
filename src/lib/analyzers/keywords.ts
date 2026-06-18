/**
 * Keywords Analyzer
 *
 * Extracts meaningful keywords from conversation content.
 * Uses frequency analysis with stop word filtering and technical term boosting.
 * Supports both English and Chinese keywords.
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  // English stop words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'am', 'are', 'was', 'were',
  'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'done', 'should', 'would', 'could', 'might',
  'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'here', 'where', 'each', 'every', 'both', 'few', 'more',
  'very', 'too', 'before', 'between', 'under', 'above',
  'still', 'own', 'same', 'while', 'through', 'during',
  'don', 'doesn', 'didn', 'won', 'wouldn', 'couldn', 'shouldn',
  // Common low-value words
  'using', 'used', 'want', 'need', 'help', 'please', 'thanks',
  'sure', 'yes', 'okay', 'ok', 'right', 'let', 'think',
  'going', 'make', 'made', 'really', 'much', 'something',
  'anything', 'everything', 'nothing', 'things', 'thing',
  // Claude-specific stop words
  'claude', 'conversation', 'message', 'chat',
])

// Technical terms that should be boosted
const TECHNICAL_TERMS = new Set([
  'api', 'css', 'sql', 'git', 'npm', 'tsx', 'jsx', 'vue', 'react',
  'node', 'next', 'prisma', 'tailwind', 'typescript', 'javascript',
  'python', 'rust', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'redis', 'postgres', 'mysql', 'mongodb', 'graphql', 'rest',
  'oauth', 'jwt', 'cors', 'ci/cd', 'webpack', 'vite', 'esbuild',
  'figma', 'sketch', 'photoshop', 'illustrator',
])

// Project-related keyword patterns
const PROJECT_PATTERNS = [
  { pattern: /\b[\w]+\.js\b/gi, weight: 3 },     // file names
  { pattern: /\b[\w]+\.ts\b/gi, weight: 3 },
  { pattern: /\b[\w]+\.py\b/gi, weight: 3 },
  { pattern: /\b[A-Z][a-z]+[A-Z]\w+/g, weight: 2 }, // CamelCase identifiers
  { pattern: /\b\w+[-_]\w+\b/g, weight: 2 },     // kebab-case or snake_case
]

/**
 * Extract keywords from an array of conversation messages.
 *
 * @param messages - Array of messages with `role` and `content` fields
 * @returns Top 15 keywords sorted by weighted frequency
 */
export function extractKeywordsFromMessages(messages: { role: string; content: string }[]): string[] {
  const allText = messages
    .map(m => m.content)
    .join(' ')

  return extractKeywords(allText)
}

/**
 * Extract keywords from a text string using frequency analysis with stop word
 * filtering and technical term boosting. Supports English and Chinese keywords.
 *
 * @param text - The input text to extract keywords from
 * @returns Top 15 keywords sorted by weighted frequency (returns empty if text < 20 chars)
 */
export function extractKeywords(text: string): string[] {
  if (!text || text.length < 20) return []

  const lowerText = text.toLowerCase()

  // Extract English words (3+ chars)
  const englishWords = lowerText.match(/[a-z][a-z0-9]{2,}/g) || []

  // Extract Chinese keywords (2+ chars, excluding common particles)
  const chineseWords = extractChineseKeywords(text)

  // Extract project-specific patterns
  const patternMatches = extractPatternMatches(text)

  // Count word frequencies
  const wordCount = new Map<string, number>()

  for (const word of englishWords) {
    if (!STOP_WORDS.has(word) && word.length >= 3) {
      const isTechnical = TECHNICAL_TERMS.has(word)
      const weight = isTechnical ? 3 : 1
      wordCount.set(word, (wordCount.get(word) || 0) + weight)
    }
  }

  // Add Chinese keywords
  for (const word of chineseWords) {
    wordCount.set(word, (wordCount.get(word) || 0) + 2)
  }

  // Add pattern matches
  for (const word of patternMatches) {
    wordCount.set(word, (wordCount.get(word) || 0) + 2)
  }

  // Sort by frequency and return top keywords
  const sorted = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)

  return sorted
}

/**
 * Extract Chinese keywords from text
 * Filters out common particles and short words
 */
function extractChineseKeywords(text: string): string[] {
  const chinesePattern = /[一-鿿]{2,}/g
  const matches = text.match(chinesePattern) || []

  // Common Chinese particles and stop words
  const chineseStopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
    '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
    '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她',
    '吗', '把', '那', '我们', '他们', '什么', '怎么', '如果', '但是',
    '因为', '所以', '可以', '这个', '那个', '还是', '已经', '不是',
    '请', '帮', '帮我', '想要', '需要', '能够', '应该', '告诉',
  ])

  return matches.filter(word => !chineseStopWords.has(word) && word.length >= 2)
}

/**
 * Extract project-specific patterns (file names, identifiers)
 */
function extractPatternMatches(text: string): string[] {
  const matches: string[] = []

  for (const { pattern } of PROJECT_PATTERNS) {
    const found = text.match(pattern)
    if (found) {
      matches.push(...found.map(m => m.toLowerCase()))
    }
  }

  return matches
}

/**
 * Generate a keyword summary string
 */
export function formatKeywords(keywords: string[]): string {
  return keywords.join(', ')
}

/**
 * Parse keywords from JSON string (stored in database)
 */
export function parseKeywords(keywordsJson: string | null): string[] {
  if (!keywordsJson) return []
  try {
    return JSON.parse(keywordsJson)
  } catch {
    return []
  }
}
