import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getPaginationParams, createPaginationResult } from './pagination.ts'

describe('getPaginationParams', () => {
  it('should return default values when no params provided', () => {
    const result = getPaginationParams({})
    assert.strictEqual(result.page, 1)
    assert.strictEqual(result.limit, 20)
    assert.strictEqual(result.skip, 0)
  })

  it('should calculate correct skip for page 2', () => {
    const result = getPaginationParams({ page: 2, limit: 10 })
    assert.strictEqual(result.page, 2)
    assert.strictEqual(result.limit, 10)
    assert.strictEqual(result.skip, 10)
  })

  it('should clamp limit to max 100', () => {
    const result = getPaginationParams({ limit: 200 })
    assert.strictEqual(result.limit, 100)
  })

  it('should clamp limit to min 1', () => {
    const result = getPaginationParams({ limit: -5 })
    assert.strictEqual(result.limit, 1)
  })

  it('should clamp page to min 1', () => {
    const result = getPaginationParams({ page: -1 })
    assert.strictEqual(result.page, 1)
    assert.strictEqual(result.skip, 0)
  })
})

describe('createPaginationResult', () => {
  it('should create correct pagination metadata', () => {
    const data = [{ id: 1 }, { id: 2 }]
    const result = createPaginationResult(data, 50, 1, 20)

    assert.deepStrictEqual(result.data, data)
    assert.strictEqual(result.pagination.total, 50)
    assert.strictEqual(result.pagination.page, 1)
    assert.strictEqual(result.pagination.limit, 20)
    assert.strictEqual(result.pagination.totalPages, 3)
    assert.strictEqual(result.pagination.hasNext, true)
    assert.strictEqual(result.pagination.hasPrev, false)
  })

  it('should handle last page correctly', () => {
    const data = [{ id: 1 }]
    const result = createPaginationResult(data, 21, 2, 20)

    assert.strictEqual(result.pagination.hasNext, false)
    assert.strictEqual(result.pagination.hasPrev, true)
    assert.strictEqual(result.pagination.totalPages, 2)
  })

  it('should handle single page', () => {
    const data = [{ id: 1 }]
    const result = createPaginationResult(data, 1, 1, 20)

    assert.strictEqual(result.pagination.hasNext, false)
    assert.strictEqual(result.pagination.hasPrev, false)
    assert.strictEqual(result.pagination.totalPages, 1)
  })
})
