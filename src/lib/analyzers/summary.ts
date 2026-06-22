/**
 * Summary Analyzer
 *
 * Generates concise summaries from conversation content using local rules.
 * Extracts the main topic, identifies conversation type, and provides a
 * structured summary suitable for the knowledge base.
 * Enhanced with additional conversation types and improved topic extraction.
 */

import { STOP_WORDS, TECHNICAL_TERMS } from './keywords'

/**
 * Result of analyzing a conversation's summary and keywords.
 */
export interface SummaryResult {
  /** A concise text summary of the conversation topic and type. */
  summary: string
  /** Top keywords extracted from conversation content. */
  keywords: string[]
  /** Detected conversation type (e.g. "code", "writing", "research"). */
  conversationType: string
  /** Confidence score for the detected type (0-1). */
  confidence: number
}

/**
 * Generate a summary and extract keywords from conversation messages.
 *
 * @param messages - Array of messages with `role` and `content` fields
 * @returns A {@link SummaryResult} containing the summary text, keywords, type, and confidence
 */
export function generateSummary(messages: { role: string; content: string }[]): SummaryResult {
  if (messages.length === 0) {
    return {
      summary: 'Empty conversation',
      keywords: [],
      conversationType: 'general',
      confidence: 0,
    }
  }

  const userMessages = messages
    .filter(m => m.role === 'user' || m.role === 'human')
    .map(m => m.content)

  const assistantMessages = messages
    .filter(m => m.role === 'assistant' || m.role === 'claude')
    .map(m => m.content)

  const { type, score } = detectConversationTypeWithScore(userMessages, assistantMessages)
  const summary = createSummaryText(userMessages, assistantMessages, type)
  const keywords = extractKeywords([...userMessages, ...assistantMessages])
  const confidence = Math.min(1, score / 5)

  return { summary, keywords, conversationType: type, confidence }
}

function createSummaryText(userMessages: string[], assistantMessages: string[], conversationType: string): string {
  if (userMessages.length === 0 && assistantMessages.length === 0) {
    return 'No messages in conversation'
  }

  const mainTopic = extractMainTopic(userMessages[0] || '')

  const parts: string[] = []

  if (mainTopic) {
    parts.push(mainTopic)
  }

  const typeDescriptions: Record<string, string> = {
    code: 'Software development discussion',
    writing: 'Writing and content creation',
    research: 'Research and analysis',
    learning: 'Learning and education',
    planning: 'Planning and strategy',
    design: 'Design and creative work',
    data: 'Data analysis and processing',
    translation: 'Translation and localization',
    DevOps: 'DevOps and infrastructure',
    security: 'Security analysis',
    database: 'Database design and optimization',
    general: 'General conversation',
  }

  if (conversationType !== 'general') {
    parts.push(typeDescriptions[conversationType] || conversationType)
  }

  // Add message count context
  if (userMessages.length > 1) {
    parts.push(`${userMessages.length} exchanges`)
  }

  return parts.filter(Boolean).join('. ') + '.'
}

function extractMainTopic(message: string): string {
  if (!message) return ''

  // Remove common prefixes
  const cleaned = message
    .replace(/^(please|can you|could you|help me|i want to|i need to|请|帮我|我想|我需要)\s*/i, '')
    .trim()

  // Take first sentence or first 120 chars
  const firstSentence = cleaned.split(/[.!?\n]/)[0] || cleaned
  let topic = firstSentence.substring(0, 120).trim()

  // Clean up the topic
  topic = topic
    .replace(/\s+/g, ' ')
    .replace(/^[,;:\-]\s*/, '')

  if (topic.length < 10) {
    // If first sentence is too short, take more
    topic = cleaned.substring(0, 120).trim()
  }

  if (topic.length < cleaned.length) {
    topic += '...'
  }

  return topic
}

/**
 * Detect the conversation type with a confidence score.
 *
 * @returns Object with `type` string and `score` (match count) for confidence calculation
 */
function detectConversationTypeWithScore(userMessages: string[], assistantMessages: string[]): { type: string; score: number } {
  const allContent = [...userMessages, ...assistantMessages].join(' ').toLowerCase()

  // Code-related (highest priority for Claude users)
  const codeIndicators = [
    'code', 'function', 'bug', 'error', 'implement', 'refactor',
    'component', 'api', 'endpoint', 'database', 'sql', 'react',
    'typescript', 'javascript', 'python', 'java', 'git', 'deploy',
    'npm', 'docker', 'kubernetes', 'ci/cd', 'test', 'debug',
    '代码', '函数', '修复', '实现', '组件', '接口',
  ]
  const codeScore = codeIndicators.filter(w => allContent.includes(w)).length
  if (codeScore >= 3) return { type: 'code', score: codeScore }

  // Writing-related
  const writingIndicators = [
    'write', 'writing', 'essay', 'article', 'story', 'blog',
    'content', 'copywriting', 'editorial', 'narrative',
    '写作', '文章', '故事', '内容',
  ]
  const writingScore = writingIndicators.filter(w => allContent.includes(w)).length
  if (writingScore >= 2) return { type: 'writing', score: writingScore }

  // Research-related
  const researchIndicators = [
    'research', 'analyze', 'analysis', 'study', 'investigate',
    'survey', 'methodology', 'findings', 'literature',
    '研究', '分析', '调查',
  ]
  const researchScore = researchIndicators.filter(w => allContent.includes(w)).length
  if (researchScore >= 2) return { type: 'research', score: researchScore }

  // Learning-related
  const learningIndicators = [
    'learn', 'course', 'tutorial', 'lesson', 'study',
    'explain', 'what is', 'how to', 'why does',
    '学习', '课程', '教程', '解释',
  ]
  const learningScore = learningIndicators.filter(w => allContent.includes(w)).length
  if (learningScore >= 2) return { type: 'learning', score: learningScore }

  // Planning-related
  const planningIndicators = [
    'plan', 'planning', 'goal', 'strategy', 'roadmap',
    'milestone', 'schedule', 'timeline', 'project',
    '计划', '目标', '策略', '路线图',
  ]
  const planningScore = planningIndicators.filter(w => allContent.includes(w)).length
  if (planningScore >= 2) return { type: 'planning', score: planningScore }

  // Design-related
  const designIndicators = [
    'design', 'ui', 'ux', 'interface', 'mockup', 'wireframe',
    'figma', 'prototype', 'layout', 'typography', 'logo',
    '设计', '界面', '原型',
  ]
  const designScore = designIndicators.filter(w => allContent.includes(w)).length
  if (designScore >= 2) return { type: 'design', score: designScore }

  // Data-related
  const dataIndicators = [
    'data', 'database', 'sql', 'analytics', 'visualization',
    'chart', 'graph', 'statistics', 'metrics', 'dashboard',
    '数据', '分析', '可视化',
  ]
  const dataScore = dataIndicators.filter(w => allContent.includes(w)).length
  if (dataScore >= 2) return { type: 'data', score: dataScore }

  // Translation-related
  const translationIndicators = [
    'translate', 'translation', 'interpret', 'localization',
    'language', '翻译', '翻译成', '译文',
  ]
  const translationScore = translationIndicators.filter(w => allContent.includes(w)).length
  if (translationScore >= 2) return { type: 'translation', score: translationScore }

  // DevOps-related
  const devopsIndicators = [
    'deploy', 'deployment', 'ci/cd', 'pipeline', 'infrastructure',
    'server', 'hosting', 'nginx', 'container', 'orchestrat',
    'terraform', 'ansible', 'aws', 'azure', 'gcp',
  ]
  const devopsScore = devopsIndicators.filter(w => allContent.includes(w)).length
  if (devopsScore >= 2) return { type: 'DevOps', score: devopsScore }

  // Security-related
  const securityIndicators = [
    'security', 'vulnerability', 'encryption', 'authentication',
    'authorization', 'xss', 'csrf', 'injection', 'firewall',
    '安全', '漏洞', '加密', '认证',
  ]
  const securityScore = securityIndicators.filter(w => allContent.includes(w)).length
  if (securityScore >= 2) return { type: 'security', score: securityScore }

  return { type: 'general', score: 0 }
}

/**
 * Detect the conversation type from message content.
 *
 * @param userMessages - Array of user message content strings
 * @param assistantMessages - Array of assistant message content strings
 * @returns The detected conversation type string
 */
function detectConversationType(userMessages: string[], assistantMessages: string[]): string {
  return detectConversationTypeWithScore(userMessages, assistantMessages).type
}

/**
 * Extract top keywords from an array of message content strings.
 * Reuses the canonical stop words and technical terms from the keywords module.
 *
 * @param messages - Concatenated message content strings
 * @returns Top 10 keywords sorted by frequency, with technical terms boosted
 */
export function extractKeywords(messages: string[]): string[] {
  const allText = messages.join(' ').toLowerCase()

  // Extract technical terms and meaningful words (3+ chars)
  const words = allText.match(/[a-z][a-z0-9]{2,}/g) || []
  const wordCount = new Map<string, number>()

  for (const word of words) {
    if (!STOP_WORDS.has(word) && word.length >= 3) {
      // Boost technical terms
      const isTechnical = /^[a-z]+[A-Z]|[-_]|\d/.test(word) || TECHNICAL_TERMS.has(word)

      const weight = isTechnical ? 2 : 1
      wordCount.set(word, (wordCount.get(word) || 0) + weight)
    }
  }

  // Sort by frequency and return top keywords
  const sorted = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  return sorted
}
