import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  )
}

export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function notFoundResponse(message = 'Resource not found'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  )
}

export function badRequestResponse(message = 'Bad request'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}
