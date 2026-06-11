/**
 * Markdown Export
 *
 * Export conversations and projects to Markdown format.
 */

/**
 * Shape of a single conversation ready for Markdown export.
 */
export interface ConversationExportData {
  title: string
  summary?: string | null
  keywords?: string[]
  createdAt: Date
  messages: {
    role: string
    content: string
    createdAt?: Date | null
  }[]
  prompts?: {
    title?: string | null
    content: string
    tags?: string | null
  }[]
  codeSnippets?: {
    language?: string | null
    code: string
    description?: string | null
  }[]
}

/**
 * Shape of a project with its conversations for Markdown export.
 */
export interface ProjectExportData {
  name: string
  summary?: string | null
  category: string
  conversations: ConversationExportData[]
}

/**
 * Render a single conversation as a Markdown document with metadata,
 * message transcript, extracted prompts, and code snippets.
 *
 * @param data - Conversation export payload
 * @returns Markdown-formatted string
 */
export function exportConversationToMarkdown(data: ConversationExportData): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${data.title}`)
  lines.push('')

  // Metadata
  lines.push('## Metadata')
  lines.push('')
  lines.push(`- **Created:** ${formatDate(data.createdAt)}`)
  if (data.summary) {
    lines.push(`- **Summary:** ${data.summary}`)
  }
  if (data.keywords && data.keywords.length > 0) {
    lines.push(`- **Keywords:** ${data.keywords.join(', ')}`)
  }
  lines.push('')

  // Messages
  lines.push('## Conversation')
  lines.push('')

  for (const message of data.messages) {
    const roleLabel = getRoleLabel(message.role)
    lines.push(`### ${roleLabel}`)
    lines.push('')
    lines.push(message.content)
    lines.push('')
  }

  // Prompts
  if (data.prompts && data.prompts.length > 0) {
    lines.push('## Extracted Prompts')
    lines.push('')

    for (const prompt of data.prompts) {
      if (prompt.title) {
        lines.push(`### ${prompt.title}`)
      }
      lines.push('```')
      lines.push(prompt.content)
      lines.push('```')
      if (prompt.tags) {
        lines.push(`**Tags:** ${prompt.tags}`)
      }
      lines.push('')
    }
  }

  // Code Snippets
  if (data.codeSnippets && data.codeSnippets.length > 0) {
    lines.push('## Code Snippets')
    lines.push('')

    for (const snippet of data.codeSnippets) {
      if (snippet.description) {
        lines.push(`### ${snippet.description}`)
      }
      const lang = snippet.language || ''
      lines.push(`\`\`\`${lang}`)
      lines.push(snippet.code)
      lines.push('```')
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Render a project and all its conversations as a single Markdown document
 * with a table of contents and abbreviated message excerpts.
 *
 * @param data - Project export payload
 * @returns Markdown-formatted string
 */
export function exportProjectToMarkdown(data: ProjectExportData): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${data.name}`)
  lines.push('')

  // Metadata
  lines.push('## Project Info')
  lines.push('')
  lines.push(`- **Category:** ${data.category}`)
  if (data.summary) {
    lines.push(`- **Summary:** ${data.summary}`)
  }
  lines.push(`- **Conversations:** ${data.conversations.length}`)
  lines.push('')

  // Table of Contents
  if (data.conversations.length > 1) {
    lines.push('## Table of Contents')
    lines.push('')
    for (let i = 0; i < data.conversations.length; i++) {
      lines.push(`${i + 1}. [${data.conversations[i].title}](#conversation-${i + 1})`)
    }
    lines.push('')
  }

  // Conversations
  for (let i = 0; i < data.conversations.length; i++) {
    const conv = data.conversations[i]
    lines.push(`## Conversation ${i + 1}: ${conv.title}`)
    lines.push('')

    if (conv.summary) {
      lines.push(`**Summary:** ${conv.summary}`)
      lines.push('')
    }

    lines.push(`**Created:** ${formatDate(conv.createdAt)}`)
    lines.push('')

    // Messages (abbreviated for project export)
    lines.push('### Messages')
    lines.push('')

    const maxMessages = 20 // Limit messages in project export
    const messagesToShow = conv.messages.slice(0, maxMessages)

    for (const message of messagesToShow) {
      const roleLabel = getRoleLabel(message.role)
      const content = message.content.length > 500
        ? message.content.substring(0, 500) + '...'
        : message.content

      lines.push(`**${roleLabel}:** ${content}`)
      lines.push('')
    }

    if (conv.messages.length > maxMessages) {
      lines.push(`*... and ${conv.messages.length - maxMessages} more messages*`)
      lines.push('')
    }

    // Divider between conversations
    if (i < data.conversations.length - 1) {
      lines.push('---')
      lines.push('')
    }
  }

  return lines.join('\n')
}

function getRoleLabel(role: string): string {
  switch (role.toLowerCase()) {
    case 'user':
    case 'human':
      return '👤 User'
    case 'assistant':
    case 'claude':
      return '🤖 Assistant'
    case 'system':
      return '⚙️ System'
    default:
      return role
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate a sanitized, date-stamped Markdown filename for an export.
 *
 * @param title - Source title to derive the slug from
 * @param type - Export type (`"conversation"` or `"project"`)
 * @returns A filename like `conversation-my-title-2024-01-01.md`
 */
export function generateExportFilename(title: string, type: 'conversation' | 'project'): string {
  const sanitized = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50)

  const timestamp = new Date().toISOString().split('T')[0]

  return `${type}-${sanitized}-${timestamp}.md`
}
