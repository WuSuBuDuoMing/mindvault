/**
 * Claude Export JSON Parser
 *
 * Supports multiple Claude export formats with fallback parsing.
 * Claude exports can have different structures depending on the version.
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
 * Normalize different Claude export formats (array, nested object, single conversation)
 * into a consistent {@link NormalizedConversation} array.
 *
 * @param data - Raw parsed JSON from a Claude export file
 * @returns Array of normalized conversations (invalid entries are filtered out)
 */
export function normalizeClaudeExport(data: any): NormalizedConversation[] {
  // Try different possible structures
  const conversations = extractConversations(data)

  return conversations
    .map(normalizeConversation)
    .filter((c): c is NormalizedConversation => c !== null)
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
      .map(normalizeMessage)
      .filter((m): m is NormalizedMessage => m !== null)

    if (messages.length === 0) {
      return null
    }

    return {
      externalId,
      title,
      createdAt,
      updatedAt,
      messages,
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
  const firstUserMessage = messages.find(m => (m.sender || m.role) === 'human' || (m.sender || m.role) === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.text || firstUserMessage.content || firstUserMessage.message || ''
    return content.substring(0, 100) + (content.length > 100 ? '...' : '')
  }

  return null
}

function normalizeMessage(raw: RawClaudeMessage): NormalizedMessage | null {
  try {
    const role = normalizeRole(raw.sender || raw.role || 'unknown')
    const content = raw.text || raw.content || raw.message || ''

    if (!content.trim()) {
      return null
    }

    const createdAt = parseDate(raw.created_at || raw.created || raw.timestamp)
    const orderIndex = raw.index || 0

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

  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) {
    return new Date()
  }

  return parsed
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

  return {
    conversationCount: conversations.length,
    totalMessages,
    dateRange,
    sampleTitles,
  }
}
