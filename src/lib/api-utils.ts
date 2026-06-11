import { NextResponse } from 'next/server'

/** Custom API error with HTTP status code and optional error code. */
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

/**
 * Convert an unknown error into a JSON `NextResponse` with the appropriate status.
 * @param error - The caught error value
 * @returns A JSON error response
 */
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

/**
 * Create a JSON success response.
 * @param data - Response payload
 * @param status - HTTP status code (default 200)
 */
export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Create a 404 Not Found response.
 * @param message - Error message (default: "Resource not found")
 */
export function notFoundResponse(message = 'Resource not found'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  )
}

/**
 * Create a 400 Bad Request response.
 * @param message - Error message (default: "Bad request")
 */
export function badRequestResponse(message = 'Bad request'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}
