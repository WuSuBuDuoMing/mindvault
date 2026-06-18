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
 * Get all tags with their usage count across conversations.
 *
 * @returns Array of tags sorted alphabetically, each with a `count` field
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
 * Add a tag to a conversation. Creates the tag if it doesn't exist.
 * Tag names are normalized to lowercase and trimmed.
 *
 * @param conversationId - The conversation ID to tag
 * @param tagName - The tag name to add
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
 * Remove a specific tag from a conversation.
 *
 * @param conversationId - The conversation ID
 * @param tagId - The tag ID to remove
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
 * Get all tags assigned to a specific conversation.
 *
 * @param conversationId - The conversation ID to query
 * @returns Array of Tag objects associated with the conversation
 */
export async function getConversationTags(conversationId: string) {
  const conversationTags = await prisma.conversationTag.findMany({
    where: { conversationId },
    include: { tag: true },
  })

  return conversationTags.map(ct => ct.tag)
}

/**
 * Replace all tags on a conversation with a new set of tag names.
 * Removes existing tags first, then adds the new ones.
 *
 * @param conversationId - The conversation ID
 * @param tagNames - Array of tag names to assign
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
