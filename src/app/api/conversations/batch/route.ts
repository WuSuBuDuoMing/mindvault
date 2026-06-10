import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleApiError, badRequestResponse, successResponse } from '@/lib/api-utils'

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return badRequestResponse('No conversation IDs provided')
    }

    // Delete conversations and cascade to related data
    const result = await prisma.conversation.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    return successResponse({
      deleted: result.count,
      message: `Deleted ${result.count} conversation(s)`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
