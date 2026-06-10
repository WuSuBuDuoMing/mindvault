/**
 * Backup & Restore
 *
 * Handles database backup and restore operations.
 */

import { prisma } from './db'

export interface BackupData {
  version: string
  createdAt: string
  conversations: any[]
  projects: any[]
  tags: any[]
  importBatches: any[]
}

/**
 * Export all data as JSON
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
 * Import data from backup
 */
export async function importBackup(data: BackupData): Promise<{
  imported: number
  skipped: number
  errors: string[]
}> {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  }

  // Validate version
  if (!data.version || !data.conversations) {
    throw new Error('Invalid backup format')
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
          messageCount: conv.messageCount || conv.messages?.length || 0,
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
    } catch (error) {
      console.error('Error importing conversation:', error)
      results.errors.push(`Failed to import: ${conv.title}`)
    }
  }

  return results
}

/**
 * Generate backup filename
 */
export function generateBackupFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `claudenote-backup-${timestamp}.json`
}
