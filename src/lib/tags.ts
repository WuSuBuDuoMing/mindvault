/**
 * Tag Manager
 *
 * Manages tags for conversations, prompts, and code snippets.
 */

import { prisma } from './db'

/**
 * A tag enriched with its usage count across conversations.
 */
export interface TagWithCount {
  id: string
  name: string
  count: number
}

/**
 * Get all tags with usage count
 */
export async function getAllTags(): Promise<TagWithCount[]> {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  })

  // Count usage for each tag
  const tagsWithCount = await Promise.all(
    tags.map(async (tag) => {
      const count = await prisma.conversationTag.count({
        where: { tagId: tag.id },
      })
      return { ...tag, count }
    })
  )

  return tagsWithCount
}

/**
 * Add tag to conversation
 */
export async function addTagToConversation(conversationId: string, tagName: string): Promise<void> {
  const normalizedTag = tagName.trim().toLowerCase()

  // Find or create tag
  let tag = await prisma.tag.findUnique({
    where: { name: normalizedTag },
  })

  if (!tag) {
    tag = await prisma.tag.create({
      data: { name: normalizedTag },
    })
  }

  // Check if already tagged
  const existing = await prisma.conversationTag.findUnique({
    where: {
      conversationId_tagId: {
        conversationId,
        tagId: tag.id,
      },
    },
  })

  if (!existing) {
    await prisma.conversationTag.create({
      data: {
        conversationId,
        tagId: tag.id,
      },
    })
  }
}

/**
 * Remove tag from conversation
 */
export async function removeTagFromConversation(conversationId: string, tagId: string): Promise<void> {
  await prisma.conversationTag.delete({
    where: {
      conversationId_tagId: {
        conversationId,
        tagId,
      },
    },
  })
}

/**
 * Get tags for a conversation
 */
export async function getConversationTags(conversationId: string) {
  const conversationTags = await prisma.conversationTag.findMany({
    where: { conversationId },
    include: { tag: true },
  })

  return conversationTags.map(ct => ct.tag)
}

/**
 * Update conversation tags
 */
export async function updateConversationTags(conversationId: string, tagNames: string[]): Promise<void> {
  // Remove all existing tags
  await prisma.conversationTag.deleteMany({
    where: { conversationId },
  })

  // Add new tags
  for (const tagName of tagNames) {
    await addTagToConversation(conversationId, tagName)
  }
}
