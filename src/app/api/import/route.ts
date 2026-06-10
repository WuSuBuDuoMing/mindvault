import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizeClaudeExport, validateClaudeExport } from '@/lib/importers/claude'
import { generateSummary } from '@/lib/analyzers/summary'
import { extractKeywordsFromMessages } from '@/lib/analyzers/keywords'
import { extractPrompts } from '@/lib/analyzers/prompts'
import { extractCodeBlocks } from '@/lib/analyzers/code'
import { classifyConversation } from '@/lib/analyzers/projects'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate the data
    const validation = validateClaudeExport(data)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Normalize the data
    const conversations = normalizeClaudeExport(data)

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: 'No valid conversations found' },
        { status: 400 }
      )
    }

    // Create import batch record
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0)
    const importBatch = await prisma.importBatch.create({
      data: {
        source: 'claude-export',
        conversationCount: conversations.length,
        messageCount: totalMessages,
        status: 'processing',
      },
    })

    // Import conversations
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const conv of conversations) {
      try {
        // Check if conversation already exists (dedup)
        const existing = await prisma.conversation.findFirst({
          where: {
            OR: [
              { externalId: conv.externalId },
              {
                AND: [
                  { title: conv.title },
                  { createdAt: conv.createdAt },
                ],
              },
            ],
          },
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Analyze conversation
        const { summary } = generateSummary(conv.messages)
        const keywords = extractKeywordsFromMessages(conv.messages)
        const prompts = extractPrompts(conv.messages)
        const codeSnippets = extractCodeBlocks(conv.messages)
        const projectCategory = classifyConversation(conv.title, conv.messages)

        // Find or create project
        let project = await prisma.project.findFirst({
          where: { category: projectCategory.category },
        })

        if (!project) {
          project = await prisma.project.create({
            data: {
              name: projectCategory.name,
              category: projectCategory.category,
              summary: projectCategory.description,
            },
          })
        }

        // Create conversation with messages and extracted data
        await prisma.conversation.create({
          data: {
            externalId: conv.externalId,
            title: conv.title,
            summary,
            keywords: JSON.stringify(keywords),
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            messageCount: conv.messages.length,
            importBatchId: importBatch.id,
            messages: {
              create: conv.messages.map((msg, index) => ({
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
                orderIndex: index,
              })),
            },
            projects: {
              create: {
                projectId: project.id,
              },
            },
            prompts: {
              create: prompts.map((prompt) => ({
                title: prompt.title,
                content: prompt.content,
                tags: JSON.stringify(prompt.tags),
              })),
            },
            codeSnippets: {
              create: codeSnippets.map((snippet) => ({
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

    // Update import batch status
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: results.errors.length > 0 ? 'completed_with_errors' : 'completed',
        conversationCount: results.imported,
        errorLog: results.errors.length > 0 ? results.errors.join('\n') : null,
      },
    })

    return NextResponse.json({
      success: true,
      ...results,
      batchId: importBatch.id,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
