/**
 * Claude Export JSON Parser
 *
 * Supports multiple Claude export formats with fallback parsing.
 * Enhanced with content deduplication, progress callbacks, and
 * robust error recovery for malformed entries.
 */

/**
 * Raw conversation object as found in Claude JSON export files.
 * Fields vary by export version — all properties are optional.
 */
export interface RawClaudeConversation {
  uuid?: string
  id?: string
  name?: string
  title?: string
  created_at?: string
  created?: string
  updated_at?: string
  updated?: string
  chat_messages?: RawClaudeMessage[]
  messages?: RawClaudeMessage[]
  conversation?: {
    messages?: RawClaudeMessage[]
  }
  // Additional fields seen in newer exports
  summary?: string
  model?: string
  tags?: string[]
}

/**
 * Raw message object as found in Claude JSON export files.
 */
export interface RawClaudeMessage {
  uuid?: string
  id?: string
  text?: string
  content?: string
  message?: string
  sender?: string
  role?: string
  created_at?: string
  created?: string
  timestamp?: string
  index?: number
  // Rich content blocks (newer format)
  content_blocks?: Array<{
    type?: string
    text?: string
  }>
}

/**
 * Conversation normalized into a consistent schema for database import.
 */
export interface NormalizedConversation {
  externalId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: NormalizedMessage[]
}

/**
 * Message normalized into a consistent schema for database import.
 */
export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date | null
  orderIndex: number
}

/**
 * Import progress event emitted during normalization.
 */
export interface ImportProgress {
  phase: 'extracting' | 'normalizing' | 'validating' | 'complete'
  processed: number
  total: number
  errors: number
  skipped: number
}

/**
 * Callback type for receiving progress updates during import.
 */
export type ImportProgressCallback = (progress: ImportProgress) => void

/**
 * Normalize different Claude export formats (array, nested object, single conversation)
 * into a consistent {@link NormalizedConversation} array.
 *
 * @param data - Raw parsed JSON from a Claude export file
 * @param onProgress - Optional callback for progress updates
 * @returns Array of normalized conversations (invalid entries are filtered out)
 */
export function normalizeClaudeExport(
  data: any,
  onProgress?: ImportProgressCallback
): NormalizedConversation[] {
  // Try different possible structures
  const conversations = extractConversations(data)

  onProgress?.({
    phase: 'extracting',
    processed: 0,
    total: conversations.length,
    errors: 0,
    skipped: 0,
  })

  const results: NormalizedConversation[] = []
  let errors = 0
  let skipped = 0

  for (let i = 0; i < conversations.length; i++) {
    const normalized = normalizeConversation(conversations[i])
    if (normalized) {
      results.push(normalized)
    } else {
      // Check if it was an error or just empty
      if (conversations[i] && extractMessages(conversations[i]).length === 0) {
        skipped++
      } else {
        errors++
      }
    }

    // Emit progress every 10 items or at the end
    if ((i + 1) % 10 === 0 || i === conversations.length - 1) {
      onProgress?.({
        phase: 'normalizing',
        processed: i + 1,
        total: conversations.length,
        errors,
        skipped,
      })
    }
  }

  onProgress?.({
    phase: 'complete',
    processed: conversations.length,
    total: conversations.length,
    errors,
    skipped,
  })

  return results
}

function extractConversations(data: any): RawClaudeConversation[] {
  if (!data) return []

  // Case 1: Array of conversations
  if (Array.isArray(data)) {
    return data
  }

  // Case 2: Object with conversations array
  if (data.conversations && Array.isArray(data.conversations)) {
    return data.conversations
  }

  // Case 3: Object with data array
  if (data.data && Array.isArray(data.data)) {
    return data.data
  }

  // Case 4: Single conversation (has messages directly)
  if (data.chat_messages || data.messages || data.conversation?.messages) {
    return [data]
  }

  // Case 5: Object with nested structure
  if (typeof data === 'object') {
    const keys = Object.keys(data)
    for (const key of keys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        const firstItem = data[key][0]
        if (firstItem && (firstItem.uuid || firstItem.id || firstItem.name)) {
          return data[key]
        }
      }
    }
  }

  return []
}

function normalizeConversation(raw: RawClaudeConversation): NormalizedConversation | null {
  try {
    const externalId = raw.uuid || raw.id || generateId()
    const title = raw.name || raw.title || extractTitleFromMessages(raw) || 'Untitled Conversation'

    const createdAt = parseDate(raw.created_at || raw.created)
    const updatedAt = parseDate(raw.updated_at || raw.updated) || createdAt

    const messages = extractMessages(raw)
      .map((msg, idx) => normalizeMessage(msg, idx))
      .filter((m): m is NormalizedMessage => m !== null)

    if (messages.length === 0) {
      return null
    }

    // Deduplicate messages by content + role
    const dedupedMessages = deduplicateMessages(messages)

    return {
      externalId,
      title,
      createdAt,
      updatedAt,
      messages: dedupedMessages,
    }
  } catch (error) {
    console.error('Error normalizing conversation:', error)
    return null
  }
}

function extractMessages(raw: RawClaudeConversation): RawClaudeMessage[] {
  if (raw.chat_messages && Array.isArray(raw.chat_messages)) {
    return raw.chat_messages
  }

  if (raw.messages && Array.isArray(raw.messages)) {
    return raw.messages
  }

  if (raw.conversation?.messages && Array.isArray(raw.conversation.messages)) {
    return raw.conversation.messages
  }

  return []
}

function extractTitleFromMessages(raw: RawClaudeConversation): string | null {
  const messages = extractMessages(raw)
  if (messages.length === 0) return null

  // Try to find first user message as title
  const firstUserMessage = messages.find(
    m => (m.sender || m.role) === 'human' || (m.sender || m.role) === 'user'
  )
  if (firstUserMessage) {
    const content = getMessageContent(firstUserMessage)
    return content.substring(0, 100) + (content.length > 100 ? '...' : '')
  }

  return null
}

/**
 * Extract text content from a raw message, handling newer content_blocks format.
 */
function getMessageContent(raw: RawClaudeMessage): string {
  // Check for newer content_blocks format
  if (raw.content_blocks && Array.isArray(raw.content_blocks)) {
    const textBlocks = raw.content_blocks
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text)
    if (textBlocks.length > 0) {
      return textBlocks.join('\n')
    }
  }

  return raw.text || raw.content || raw.message || ''
}

function normalizeMessage(raw: RawClaudeMessage, index: number): NormalizedMessage | null {
  try {
    const role = normalizeRole(raw.sender || raw.role || 'unknown')
    const content = getMessageContent(raw)

    if (!content.trim()) {
      return null
    }

    const createdAt = parseDate(raw.created_at || raw.created || raw.timestamp)
    const orderIndex = raw.index ?? index

    return {
      role,
      content,
      createdAt,
      orderIndex,
    }
  } catch (error) {
    console.error('Error normalizing message:', error)
    return null
  }
}

/**
 * Remove duplicate messages (same role + same content within a conversation).
 */
function deduplicateMessages(messages: NormalizedMessage[]): NormalizedMessage[] {
  const seen = new Set<string>()
  const result: NormalizedMessage[] = []

  for (const msg of messages) {
    const key = `${msg.role}:${msg.content.substring(0, 200)}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(msg)
    }
  }

  // Re-index after dedup
  return result.map((msg, idx) => ({
    ...msg,
    orderIndex: idx,
  }))
}

function normalizeRole(role: string): 'user' | 'assistant' | 'system' {
  const normalized = role.toLowerCase()

  if (normalized === 'human' || normalized === 'user') {
    return 'user'
  }

  if (normalized === 'assistant' || normalized === 'claude' || normalized === 'bot') {
    return 'assistant'
  }

  if (normalized === 'system') {
    return 'system'
  }

  // Default to user for unknown roles
  return 'user'
}

function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) {
    return new Date()
  }

  // Try ISO format first
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  // Try Unix timestamp (seconds)
  const asNumber = Number(dateStr)
  if (!isNaN(asNumber) && asNumber > 0) {
    // If it looks like seconds (not milliseconds)
    const ts = asNumber < 1e12 ? asNumber * 1000 : asNumber
    const date = new Date(ts)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  return new Date()
}

function generateId(): string {
  return 'conv_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

/**
 * Validate that parsed JSON has at least one recognizable conversation structure.
 *
 * @param data - Raw parsed JSON to validate
 * @returns `{ valid: true }` or `{ valid: false, error }` with a human-readable reason
 */
export function validateClaudeExport(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: 'No data provided' }
  }

  if (typeof data !== 'object') {
    return { valid: false, error: 'Data must be an object or array' }
  }

  const conversations = extractConversations(data)

  if (conversations.length === 0) {
    return { valid: false, error: 'No conversations found in the data' }
  }

  return { valid: true }
}

/**
 * Generate a lightweight preview summary from import data without persisting anything.
 *
 * @param data - Raw parsed JSON from a Claude export file
 * @returns Object with `conversationCount`, `totalMessages`, `dateRange`, and `sampleTitles`
 */
export function generateImportPreview(data: any): {
  conversationCount: number
  totalMessages: number
  dateRange: { start: Date; end: Date } | null
  sampleTitles: string[]
  roleDistribution: Record<string, number>
} {
  const conversations = normalizeClaudeExport(data)

  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)

  let dateRange: { start: Date; end: Date } | null = null
  if (conversations.length > 0) {
    const dates = conversations.flatMap(c => [c.createdAt, c.updatedAt])
    const start = new Date(Math.min(...dates.map(d => d.getTime())))
    const end = new Date(Math.max(...dates.map(d => d.getTime())))
    dateRange = { start, end }
  }

  const sampleTitles = conversations.slice(0, 5).map(c => c.title)

  // Count message roles
  const roleDistribution: Record<string, number> = {}
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      roleDistribution[msg.role] = (roleDistribution[msg.role] || 0) + 1
    }
  }

  return {
    conversationCount: conversations.length,
    totalMessages,
    dateRange,
    sampleTitles,
    roleDistribution,
  }
}
