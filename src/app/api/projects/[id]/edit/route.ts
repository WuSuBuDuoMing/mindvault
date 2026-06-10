import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleApiError, badRequestResponse, notFoundResponse, successResponse } from '@/lib/api-utils'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, category, summary } = await request.json()

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return notFoundResponse('Project not found')
    }

    // Check if new name conflicts with existing project
    if (name && name !== project.name) {
      const existing = await prisma.project.findUnique({
        where: { name },
      })
      if (existing) {
        return badRequestResponse('A project with this name already exists')
      }
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(summary !== undefined && { summary }),
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
    })

    if (!project) {
      return notFoundResponse('Project not found')
    }

    if (project._count.conversations > 0) {
      return badRequestResponse(
        `Cannot delete project with ${project._count.conversations} conversation(s). Remove conversations from the project first.`
      )
    }

    await prisma.project.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'Project deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
