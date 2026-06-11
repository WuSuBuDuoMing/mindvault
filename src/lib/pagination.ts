/**
 * Pagination Utility
 *
 * Provides reusable pagination logic for API routes and components.
 */

/**
 * Accepted pagination query parameters.
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Paginated response envelope containing data and navigation metadata.
 *
 * @typeParam T - Element type of the data array
 */
export interface PaginationResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Normalizes raw pagination parameters, clamping values to safe ranges.
 *
 * @param params - Raw page and limit values from the request
 * @returns Sanitized `{ page, limit, skip }` for Prisma queries
 */
export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Builds a standard paginated result envelope.
 *
 * @typeParam T - Element type of the data array
 * @param data - Page of results
 * @param total - Total number of matching records
 * @param page - Current page number (1-indexed)
 * @param limit - Records per page
 * @returns A {@link PaginationResult} with navigation flags
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Converts pagination metadata into HTTP response headers.
 *
 * @param pagination - Pagination metadata from a {@link PaginationResult}
 * @returns Record of `X-*` pagination headers
 */
export function getPaginationHeaders(pagination: PaginationResult<any>['pagination']) {
  return {
    'X-Total-Count': pagination.total.toString(),
    'X-Page': pagination.page.toString(),
    'X-Total-Pages': pagination.totalPages.toString(),
    'X-Has-Next': pagination.hasNext.toString(),
    'X-Has-Prev': pagination.hasPrev.toString(),
  }
}
