import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ApiError } from './api-utils'

describe('ApiError', () => {
  it('should create error with message and status code', () => {
    const error = new ApiError('Not found', 404)
    assert.strictEqual(error.message, 'Not found')
    assert.strictEqual(error.statusCode, 404)
    assert.strictEqual(error.name, 'ApiError')
    assert.ok(error instanceof Error)
  })

  it('should default to 500 status code', () => {
    const error = new ApiError('Server error')
    assert.strictEqual(error.statusCode, 500)
  })

  it('should accept optional error code', () => {
    const error = new ApiError('Validation failed', 400, 'VALIDATION_ERROR')
    assert.strictEqual(error.code, 'VALIDATION_ERROR')
    assert.strictEqual(error.statusCode, 400)
  })

  it('should have undefined code when not provided', () => {
    const error = new ApiError('Something happened')
    assert.strictEqual(error.code, undefined)
  })
})
