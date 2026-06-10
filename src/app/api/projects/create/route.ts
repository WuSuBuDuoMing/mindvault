import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleApiError, badRequestResponse, successResponse } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const { name, category, summary } = await request.json()

    if (!name || !category) {
      return badRequestResponse('Name and category are required')
    }

    // Check if project with same name exists
    const existing = await prisma.project.findUnique({
      where: { name },
    })

    if (existing) {
      return badRequestResponse('A project with this name already exists')
    }

    const project = await prisma.project.create({
      data: {
        name,
        category,
        summary: summary || null,
      },
    })

    return successResponse(project, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
