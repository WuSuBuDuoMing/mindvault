import { describe, it } from 'node:test'
import assert from 'node:assert'

/**
 * Inline copy of buildFuzzyRegex for testing without db dependency.
 * This tests the pure function logic without Prisma imports.
 */
function buildFuzzyRegex(query: string): RegExp {
  const words = query.trim().split(/\s+/)

  const patterns = words.map((word) => {
    const tokens = [...word].map((ch) =>
      ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    const fuzzy = tokens.join('.{0,1}')
    return fuzzy
  })

  const combined = patterns.map((p) => `(${p})`).join('.*')
  return new RegExp(combined, 'i')
}

describe('buildFuzzyRegex', () => {
  it('should match exact strings', () => {
    const regex = buildFuzzyRegex('hello')
    assert.ok(regex.test('hello'))
    assert.ok(regex.test('say hello world'))
  })

  it('should match with inserted characters (fuzzy tolerance)', () => {
    const regex = buildFuzzyRegex('helo')
    // 'hello' has one extra 'l' between 'e' and 'o' — the .{0,1} tolerance handles this
    assert.ok(regex.test('hello'))
    assert.ok(regex.test('say hello world'))
    // But very different strings should not match
    assert.ok(!regex.test('xyzabc'))
  })

  it('should handle multi-word queries', () => {
    const regex = buildFuzzyRegex('hello world')
    assert.ok(regex.test('hello world'))
    // Words in correct order with content between them
    assert.ok(regex.test('hello wonderful world'))
  })

  it('should be case insensitive', () => {
    const regex = buildFuzzyRegex('Hello')
    assert.ok(regex.test('hello'))
    assert.ok(regex.test('HELLO'))
  })

  it('should escape special regex characters', () => {
    const regex = buildFuzzyRegex('hello.world')
    // 'hello.world' should match — the dot is escaped as a literal
    assert.ok(regex.test('hello.world'))
    // Without escaping, 'hello.world' would match 'helloXworld' (dot as wildcard)
    // With per-char escaping, the dot becomes \. — only literal dots match
    assert.ok(!regex.test('helloXworld'))
  })

  it('should handle single character queries', () => {
    const regex = buildFuzzyRegex('a')
    assert.ok(regex.test('a'))
    assert.ok(regex.test('abc'))
  })

  it('should not match completely different strings', () => {
    const regex = buildFuzzyRegex('search')
    assert.ok(!regex.test('xyzabc'))
    assert.ok(!regex.test(''))
  })

  it('should handle empty-ish queries', () => {
    const regex = buildFuzzyRegex('test')
    assert.ok(regex.test('test'))
    assert.ok(regex.test('a test here'))
  })
})
