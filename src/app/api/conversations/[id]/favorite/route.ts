import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleApiError, notFoundResponse, successResponse } from '@/lib/api-utils'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { isFavorite } = await request.json()

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    })

    if (!conversation) {
      return notFoundResponse('Conversation not found')
    }

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: { isFavorite: Boolean(isFavorite) },
    })

    return successResponse({ id: updated.id, isFavorite: updated.isFavorite })
  } catch (error) {
    return handleApiError(error)
  }
}
