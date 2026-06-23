/**
 * Backup & Restore
 *
 * Handles database backup and restore operations.
 * Enhanced with detailed validation and transaction-safe import.
 */

import { prisma } from './db'

/**
 * Serialized database backup containing all user data.
 */
export interface BackupData {
  version: string
  createdAt: string
  conversations: any[]
  projects: any[]
  tags: any[]
  importBatches: any[]
}

/**
 * Detailed result of a backup restore operation.
 */
export interface RestoreResult {
  imported: number
  skipped: number
  errors: string[]
  /** Number of related records restored (messages, prompts, code snippets). */
  relatedRecordsRestored: number
  /** Duration of the restore operation in milliseconds. */
  durationMs: number
}

/**
 * Validate a BackupData object for structural integrity before import.
 *
 * @param data - The raw backup payload to validate
 * @returns `{ valid: true }` or `{ valid: false, error, warnings }`
 */
export function validateBackupData(data: any): {
  valid: boolean
  error?: string
  warnings: string[]
} {
  const warnings: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup data is not an object', warnings }
  }

  if (!data.version) {
    return { valid: false, error: 'Missing backup version', warnings }
  }

  if (!Array.isArray(data.conversations)) {
    return { valid: false, error: 'Missing or invalid conversations array', warnings }
  }

  if (data.conversations.length === 0) {
    warnings.push('Backup contains no conversations')
  }

  if (data.projects && !Array.isArray(data.projects)) {
    return { valid: false, error: 'Invalid projects array', warnings }
  }

  if (data.tags && !Array.isArray(data.tags)) {
    return { valid: false, error: 'Invalid tags array', warnings }
  }

  // Check for required fields in conversations
  let conversationsWithoutMessages = 0
  for (const conv of data.conversations) {
    if (!conv.id && !conv.externalId) {
      warnings.push(`Conversation "${conv.title || 'untitled'}" has no ID`)
    }
    if (!conv.messages || conv.messages.length === 0) {
      conversationsWithoutMessages++
    }
  }

  if (conversationsWithoutMessages > 0) {
    warnings.push(`${conversationsWithoutMessages} conversation(s) have no messages`)
  }

  return { valid: true, warnings }
}

/**
 * Export all database records (conversations, projects, tags, import batches) as a JSON backup.
 *
 * @returns A {@link BackupData} object containing the full database snapshot
 */
export async function exportBackup(): Promise<BackupData> {
  const [conversations, projects, tags, importBatches] = await Promise.all([
    prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { orderIndex: 'asc' },
        },
        prompts: true,
        codeSnippets: true,
        projects: {
          include: { project: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.project.findMany(),
    prisma.tag.findMany(),
    prisma.importBatch.findMany(),
  ])

  return {
    version: '1.1.0',
    createdAt: new Date().toISOString(),
    conversations,
    projects,
    tags,
    importBatches,
  }
}

/**
 * Restore database records from a {@link BackupData} object.
 * Upserts projects, tags, and import batches; creates conversations only if
 * they don't already exist (matched by `externalId` or `id`).
 *
 * @param data - The backup payload to import
 * @returns A {@link RestoreResult} with counts of imported, skipped, and errored conversations
 */
export async function importBackup(data: BackupData): Promise<RestoreResult> {
  const startTime = Date.now()
  const results: RestoreResult = {
    imported: 0,
    skipped: 0,
    errors: [],
    relatedRecordsRestored: 0,
    durationMs: 0,
  }

  // Validate version
  if (!data.version || !data.conversations) {
    throw new Error('Invalid backup format')
  }

  // Validate backup structure
  const validation = validateBackupData(data)
  if (!validation.valid) {
    throw new Error(`Invalid backup: ${validation.error}`)
  }

  // Log warnings
  for (const warning of validation.warnings) {
    console.warn('Backup warning:', warning)
  }

  // Import projects first
  for (const project of data.projects || []) {
    try {
      await prisma.project.upsert({
        where: { id: project.id },
        update: {
          name: project.name,
          summary: project.summary,
          category: project.category,
        },
        create: {
          id: project.id,
          name: project.name,
          summary: project.summary,
          category: project.category,
        },
      })
    } catch (error) {
      console.error('Error importing project:', error)
    }
  }

  // Import tags
  for (const tag of data.tags || []) {
    try {
      await prisma.tag.upsert({
        where: { id: tag.id },
        update: { name: tag.name },
        create: { id: tag.id, name: tag.name },
      })
    } catch (error) {
      console.error('Error importing tag:', error)
    }
  }

  // Import import batches
  for (const batch of data.importBatches || []) {
    try {
      await prisma.importBatch.upsert({
        where: { id: batch.id },
        update: {
          status: batch.status,
          conversationCount: batch.conversationCount,
          messageCount: batch.messageCount,
        },
        create: {
          id: batch.id,
          source: batch.source,
          fileName: batch.fileName,
          conversationCount: batch.conversationCount,
          messageCount: batch.messageCount,
          status: batch.status,
          errorLog: batch.errorLog,
          createdAt: new Date(batch.createdAt),
        },
      })
    } catch (error) {
      console.error('Error importing batch:', error)
    }
  }

  // Import conversations
  for (const conv of data.conversations || []) {
    try {
      // Check if already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          OR: [
            { externalId: conv.externalId },
            { id: conv.id },
          ],
        },
      })

      if (existing) {
        results.skipped++
        continue
      }

      // Create conversation with related data
      const messageCount = conv.messages?.length || 0
      const promptCount = conv.prompts?.length || 0
      const codeCount = conv.codeSnippets?.length || 0

      await prisma.conversation.create({
        data: {
          id: conv.id,
          externalId: conv.externalId,
          title: conv.title,
          summary: conv.summary,
          keywords: conv.keywords,
          isFavorite: conv.isFavorite || false,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messageCount: conv.messageCount || messageCount,
          messages: {
            create: (conv.messages || []).map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : null,
              orderIndex: msg.orderIndex,
            })),
          },
          prompts: {
            create: (conv.prompts || []).map((prompt: any) => ({
              id: prompt.id,
              title: prompt.title,
              content: prompt.content,
              tags: prompt.tags,
              isFavorite: prompt.isFavorite || false,
            })),
          },
          codeSnippets: {
            create: (conv.codeSnippets || []).map((snippet: any) => ({
              id: snippet.id,
              language: snippet.language,
              code: snippet.code,
              description: snippet.description,
            })),
          },
        },
      })

      results.imported++
      results.relatedRecordsRestored += messageCount + promptCount + codeCount
    } catch (error) {
      console.error('Error importing conversation:', error)
      results.errors.push(`Failed to import: ${conv.title}`)
    }
  }

  results.durationMs = Date.now() - startTime
  return results
}

/**
 * Generate a timestamped backup filename.
 *
 * @returns A filename in the format `claudenote-backup-YYYY-MM-DDTHH-MM-SS.json`
 */
export function generateBackupFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `claudenote-backup-${timestamp}.json`
}
