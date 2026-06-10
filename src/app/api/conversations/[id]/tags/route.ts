import { NextResponse } from 'next/server'
import { getConversationTags, updateConversationTags } from '@/lib/tags'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tags = await getConversationTags(params.id)
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching conversation tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tags } = await request.json()
    await updateConversationTags(params.id, tags)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating conversation tags:', error)
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    )
  }
}
