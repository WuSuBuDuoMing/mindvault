/**
 * Pagination Utility
 *
 * Provides reusable pagination logic for API routes and components.
 */

export interface PaginationParams {
  page?: number
  limit?: number
}

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

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

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

export function getPaginationHeaders(pagination: PaginationResult<any>['pagination']) {
  return {
    'X-Total-Count': pagination.total.toString(),
    'X-Page': pagination.page.toString(),
    'X-Total-Pages': pagination.totalPages.toString(),
    'X-Has-Next': pagination.hasNext.toString(),
    'X-Has-Prev': pagination.hasPrev.toString(),
  }
}
