/**
 * Multi-Format Export
 *
 * Export conversations, projects, prompts, and code snippets in
 * Markdown, JSON, CSV, and plain-text (PDF-ready HTML) formats.
 * Enhanced with bulk export utilities, format selection helpers, and export statistics.
 */

/**
 * Shape of a single conversation ready for export.
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
 * Shape of a project with its conversations for export.
 */
export interface ProjectExportData {
  name: string
  summary?: string | null
  category: string
  conversations: ConversationExportData[]
}

/**
 * Shape of a prompt item for export.
 */
export interface PromptExportData {
  title?: string | null
  content: string
  tags?: string | null
  isFavorite?: boolean
  createdAt?: Date
  conversationTitle?: string
}

/**
 * Shape of a code snippet for export.
 */
export interface CodeSnippetExportData {
  language?: string | null
  code: string
  description?: string | null
  createdAt?: Date
  conversationTitle?: string
}

/**
 * Supported export format types.
 */
export type ExportFormat = 'md' | 'json' | 'html' | 'csv'

/**
 * Supported content types for export.
 */
export type ExportContentType = 'conversation' | 'project' | 'prompts' | 'code-snippets'

/**
 * Export result containing the formatted content and metadata.
 */
export interface ExportResult {
  /** The exported content as a string. */
  content: string
  /** The format used for export. */
  format: ExportFormat
  /** The content type that was exported. */
  contentType: ExportContentType
  /** Generated filename for the export. */
  filename: string
}

/**
 * Export a conversation in the specified format, returning a structured result.
 *
 * @param data - The conversation data to export
 * @param format - The export format (md, json, html, csv)
 * @returns An {@link ExportResult} with content, format, and filename
 */
export function exportConversation(
  data: ConversationExportData,
  format: ExportFormat = 'md'
): ExportResult {
  const content = format === 'json'
    ? exportConversationToJSON(data)
    : format === 'html'
    ? exportConversationToHTML(data)
    : exportConversationToMarkdown(data)

  return {
    content,
    format,
    contentType: 'conversation',
    filename: generateExportFilename(data.title, 'conversation', format),
  }
}

/**
 * Export prompts in the specified format.
 *
 * @param prompts - The prompt data to export
 * @param format - The export format (md, json, html, csv)
 * @returns An {@link ExportResult} with content, format, and filename
 */
export function exportPrompts(
  prompts: PromptExportData[],
  format: ExportFormat = 'json'
): ExportResult {
  let content: string
  if (format === 'json') {
    content = exportPromptsToJSON(prompts)
  } else if (format === 'html') {
    content = exportPromptsToHTML(prompts)
  } else {
    // Markdown format for prompts
    const lines: string[] = ['# Prompt Library', '', `Exported on ${new Date().toLocaleDateString()} | Total: ${prompts.length} prompts`, '']
    for (const p of prompts) {
      if (p.title) lines.push(`## ${p.title}`)
      if (p.conversationTitle) lines.push(`*From: ${p.conversationTitle}*`)
      if (p.tags) lines.push(`**Tags:** ${p.tags}`)
      if (p.isFavorite) lines.push('**Favorite:** Yes')
      lines.push('')
      lines.push('```')
      lines.push(p.content)
      lines.push('```')
      lines.push('')
    }
    content = lines.join('\n')
  }

  return {
    content,
    format,
    contentType: 'prompts',
    filename: generateExportFilename('prompt-library', 'prompts', format),
  }
}

/**
 * Export code snippets in the specified format.
 *
 * @param snippets - The code snippet data to export
 * @param format - The export format (md, json, html, csv)
 * @returns An {@link ExportResult} with content, format, and filename
 */
export function exportCodeSnippets(
  snippets: CodeSnippetExportData[],
  format: ExportFormat = 'json'
): ExportResult {
  let content: string
  if (format === 'json') {
    content = exportCodeSnippetsToJSON(snippets)
  } else if (format === 'html') {
    content = exportCodeSnippetsToHTML(snippets)
  } else {
    // Markdown format for code snippets
    const lines: string[] = ['# Code Snippets Library', '', `Exported on ${new Date().toLocaleDateString()} | Total: ${snippets.length} snippets`, '']
    for (const s of snippets) {
      lines.push(`## ${s.description || `${s.language || 'Code'} Snippet`}`)
      if (s.conversationTitle) lines.push(`*From: ${s.conversationTitle}*`)
      lines.push('')
      lines.push('```' + (s.language || ''))
      lines.push(s.code)
      lines.push('```')
      lines.push('')
    }
    content = lines.join('\n')
  }

  return {
    content,
    format,
    contentType: 'code-snippets',
    filename: generateExportFilename('code-snippets', 'code-snippets', format),
  }
}

/**
 * Statistics about a completed export operation.
 */
export interface ExportStatistics {
  /** Total number of items exported */
  totalItems: number
  /** Total size of exported content in bytes */
  sizeBytes: number
  /** The export format used */
  format: 'md' | 'json' | 'html' | 'csv'
  /** The content type exported */
  type: string
  /** When the export was generated */
  exportedAt: Date
}

// ─── Markdown Export ─────────────────────────────────────────────────────────

/**
 * Render a single conversation as a Markdown document with metadata,
 * message transcript, extracted prompts, and code snippets.
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

    const maxMessages = 20
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

// ─── JSON Export ─────────────────────────────────────────────────────────────

/**
 * Export a single conversation as a structured JSON string.
 */
export function exportConversationToJSON(data: ConversationExportData): string {
  return JSON.stringify({
    format: 'mindvault-conversation',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    conversation: {
      title: data.title,
      summary: data.summary || null,
      keywords: data.keywords || [],
      createdAt: data.createdAt.toISOString(),
      messageCount: data.messages.length,
      messages: data.messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt?.toISOString() || null,
      })),
      prompts: (data.prompts || []).map((p) => ({
        title: p.title || null,
        content: p.content,
        tags: p.tags || null,
      })),
      codeSnippets: (data.codeSnippets || []).map((s) => ({
        language: s.language || null,
        code: s.code,
        description: s.description || null,
      })),
    },
  }, null, 2)
}

/**
 * Export a project and all its conversations as a structured JSON string.
 */
export function exportProjectToJSON(data: ProjectExportData): string {
  return JSON.stringify({
    format: 'mindvault-project',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project: {
      name: data.name,
      summary: data.summary || null,
      category: data.category,
      conversationCount: data.conversations.length,
      conversations: data.conversations.map((conv) => ({
        title: conv.title,
        summary: conv.summary || null,
        createdAt: conv.createdAt.toISOString(),
        messageCount: conv.messages.length,
        messages: conv.messages.map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt?.toISOString() || null,
        })),
      })),
    },
  }, null, 2)
}

/**
 * Export prompts as a structured JSON string.
 */
export function exportPromptsToJSON(prompts: PromptExportData[]): string {
  return JSON.stringify({
    format: 'mindvault-prompts',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalCount: prompts.length,
    prompts: prompts.map((p) => ({
      title: p.title || null,
      content: p.content,
      tags: p.tags || null,
      isFavorite: p.isFavorite || false,
      createdAt: p.createdAt?.toISOString() || null,
      conversationTitle: p.conversationTitle || null,
    })),
  }, null, 2)
}

/**
 * Export code snippets as a structured JSON string.
 */
export function exportCodeSnippetsToJSON(snippets: CodeSnippetExportData[]): string {
  return JSON.stringify({
    format: 'mindvault-code-snippets',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalCount: snippets.length,
    snippets: snippets.map((s) => ({
      language: s.language || null,
      code: s.code,
      description: s.description || null,
      lineCount: s.code.split('\n').length,
      createdAt: s.createdAt?.toISOString() || null,
      conversationTitle: s.conversationTitle || null,
    })),
  }, null, 2)
}

// ─── HTML (PDF-ready) Export ─────────────────────────────────────────────────

/**
 * Export a conversation as a self-contained HTML document suitable for PDF generation
 * via browser print or headless tools.
 */
export function exportConversationToHTML(data: ConversationExportData): string {
  const esc = escapeHTML
  const parts: string[] = []

  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="en"><head>')
  parts.push('<meta charset="UTF-8">')
  parts.push(`<title>${esc(data.title)}</title>`)
  parts.push('<style>')
  parts.push(HTML_STYLES)
  parts.push('</style></head><body>')
  parts.push(`<h1>${esc(data.title)}</h1>`)

  // Metadata
  parts.push('<div class="metadata">')
  parts.push(`<p><strong>Created:</strong> ${formatDate(data.createdAt)}</p>`)
  if (data.summary) parts.push(`<p><strong>Summary:</strong> ${esc(data.summary)}</p>`)
  if (data.keywords?.length) parts.push(`<p><strong>Keywords:</strong> ${esc(data.keywords.join(', '))}</p>`)
  parts.push('</div>')

  // Messages
  parts.push('<h2>Conversation</h2>')
  for (const msg of data.messages) {
    parts.push(`<div class="message ${msg.role}">`)
    parts.push(`<div class="role">${esc(getRoleLabel(msg.role))}</div>`)
    parts.push(`<div class="content">${esc(msg.content)}</div>`)
    parts.push('</div>')
  }

  // Prompts
  if (data.prompts?.length) {
    parts.push('<h2>Extracted Prompts</h2>')
    for (const p of data.prompts) {
      if (p.title) parts.push(`<h3>${esc(p.title)}</h3>`)
      parts.push(`<pre>${esc(p.content)}</pre>`)
      if (p.tags) parts.push(`<p><em>Tags:</em> ${esc(p.tags)}</p>`)
    }
  }

  // Code
  if (data.codeSnippets?.length) {
    parts.push('<h2>Code Snippets</h2>')
    for (const s of data.codeSnippets) {
      if (s.description) parts.push(`<h3>${esc(s.description)}</h3>`)
      parts.push(`<pre><code>${esc(s.code)}</code></pre>`)
    }
  }

  parts.push('</body></html>')
  return parts.join('\n')
}

/**
 * Export prompts as a self-contained HTML document.
 */
export function exportPromptsToHTML(prompts: PromptExportData[]): string {
  const esc = escapeHTML
  const parts: string[] = []

  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="en"><head>')
  parts.push('<meta charset="UTF-8">')
  parts.push('<title>Prompt Library</title>')
  parts.push('<style>')
  parts.push(HTML_STYLES)
  parts.push('</style></head><body>')
  parts.push('<h1>Prompt Library</h1>')
  parts.push(`<p>Exported on ${new Date().toLocaleDateString()} | Total: ${prompts.length} prompts</p>`)

  for (const p of prompts) {
    parts.push('<div class="card">')
    parts.push(`<h2>${esc(p.title || 'Untitled Prompt')}</h2>`)
    if (p.conversationTitle) parts.push(`<p><em>From: ${esc(p.conversationTitle)}</em></p>`)
    if (p.tags) parts.push(`<p><strong>Tags:</strong> ${esc(p.tags)}</p>`)
    if (p.isFavorite) parts.push('<p><strong>Favorite:</strong> Yes</p>')
    parts.push(`<pre>${esc(p.content)}</pre>`)
    parts.push('</div>')
  }

  parts.push('</body></html>')
  return parts.join('\n')
}

/**
 * Export code snippets as a self-contained HTML document.
 */
export function exportCodeSnippetsToHTML(snippets: CodeSnippetExportData[]): string {
  const esc = escapeHTML
  const parts: string[] = []

  parts.push('<!DOCTYPE html>')
  parts.push('<html lang="en"><head>')
  parts.push('<meta charset="UTF-8">')
  parts.push('<title>Code Snippets</title>')
  parts.push('<style>')
  parts.push(HTML_STYLES)
  parts.push('</style></head><body>')
  parts.push('<h1>Code Snippets Library</h1>')
  parts.push(`<p>Exported on ${new Date().toLocaleDateString()} | Total: ${snippets.length} snippets</p>`)

  for (const s of snippets) {
    parts.push('<div class="card">')
    parts.push(`<h2>${esc(s.description || `${s.language || 'Code'} Snippet`)}</h2>`)
    parts.push(`<p><strong>Language:</strong> ${esc(s.language || 'Unknown')}</p>`)
    if (s.conversationTitle) parts.push(`<p><em>From: ${esc(s.conversationTitle)}</em></p>`)
    parts.push(`<pre><code>${esc(s.code)}</code></pre>`)
    parts.push('</div>')
  }

  parts.push('</body></html>')
  return parts.join('\n')
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

/**
 * Escape a value for CSV output (wraps in quotes if it contains commas, quotes, or newlines).
 */
function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Export prompts as a CSV string with headers.
 */
export function exportPromptsToCSV(prompts: PromptExportData[]): string {
  const header = ['Title', 'Content', 'Tags', 'Favorite', 'From', 'Created']
  const rows = prompts.map((p) => [
    csvEscape(p.title || 'Untitled'),
    csvEscape(p.content),
    csvEscape(p.tags || ''),
    p.isFavorite ? 'Yes' : 'No',
    csvEscape(p.conversationTitle || ''),
    p.createdAt ? p.createdAt.toISOString() : '',
  ])

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Export code snippets as a CSV string with headers.
 */
export function exportCodeSnippetsToCSV(snippets: CodeSnippetExportData[]): string {
  const header = ['Language', 'Description', 'Lines', 'Code', 'From', 'Created']
  const rows = snippets.map((s) => [
    csvEscape(s.language || 'Unknown'),
    csvEscape(s.description || ''),
    String(s.code.split('\n').length),
    csvEscape(s.code),
    csvEscape(s.conversationTitle || ''),
    s.createdAt ? s.createdAt.toISOString() : '',
  ])

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Export conversations summary as a CSV string (not full messages — for overview).
 */
export function exportConversationsSummaryToCSV(conversations: ConversationExportData[]): string {
  const header = ['Title', 'Summary', 'Keywords', 'Messages', 'Prompts', 'Code Snippets', 'Created']
  const rows = conversations.map((c) => [
    csvEscape(c.title),
    csvEscape(c.summary || ''),
    csvEscape((c.keywords || []).join('; ')),
    String(c.messages.length),
    String(c.prompts?.length || 0),
    String(c.codeSnippets?.length || 0),
    c.createdAt.toISOString(),
  ])

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

// ─── Export Statistics ───────────────────────────────────────────────────────

/**
 * Build export statistics from the exported content.
 *
 * @param content - The raw exported string
 * @param format - The export format
 * @param type - The content type
 * @param totalItems - Number of items exported
 * @returns An {@link ExportStatistics} object
 */
export function buildExportStatistics(
  content: string,
  format: ExportStatistics['format'],
  type: string,
  totalItems: number
): ExportStatistics {
  return {
    totalItems,
    sizeBytes: new TextEncoder().encode(content).length,
    format,
    type,
    exportedAt: new Date(),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRoleLabel(role: string): string {
  switch (role.toLowerCase()) {
    case 'user':
    case 'human':
      return 'User'
    case 'assistant':
    case 'claude':
      return 'Assistant'
    case 'system':
      return 'System'
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

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate a sanitized, date-stamped filename for an export.
 *
 * @param title - Source title to derive the slug from
 * @param type - Export type (`"conversation"` or `"project"`)
 * @param ext - File extension (`"md"`, `"json"`, `"html"`)
 * @returns A filename like `conversation-my-title-2024-01-01.md`
 */
export function generateExportFilename(
  title: string,
  type: 'conversation' | 'project' | 'prompts' | 'code-snippets',
  ext: 'md' | 'json' | 'html' | 'csv' = 'md'
): string {
  const sanitized = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50)

  const timestamp = new Date().toISOString().split('T')[0]

  return `${type}-${sanitized}-${timestamp}.${ext}`
}

const HTML_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.6; }
  h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  h2 { color: #374151; margin-top: 2rem; }
  h3 { color: #6b7280; }
  .metadata { background: #f9fafb; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
  .message { margin: 1rem 0; padding: 1rem; border-radius: 8px; }
  .message.user { background: #eff6ff; border-left: 4px solid #3b82f6; }
  .message.assistant { background: #f0fdf4; border-left: 4px solid #22c55e; }
  .message.system { background: #fefce8; border-left: 4px solid #eab308; }
  .role { font-weight: bold; margin-bottom: 0.5rem; }
  .content { white-space: pre-wrap; }
  .card { background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #e5e7eb; }
  pre { background: #1f2937; color: #f3f4f6; padding: 1rem; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
  code { font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 0.9rem; }
  @media print { body { max-width: none; padding: 0; } }
`
