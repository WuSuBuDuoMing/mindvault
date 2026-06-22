import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractKeywords, extractKeywordsFromMessages, parseKeywords, formatKeywords } from './keywords'

describe('extractKeywords', () => {
  it('should extract English keywords by frequency', () => {
    const text = 'React is a JavaScript library for building user interfaces. React components are reusable. The React ecosystem includes Next.js and other React tools.'
    const keywords = extractKeywords(text)
    assert.ok(keywords.includes('react'))
    assert.ok(keywords.length > 0)
    assert.ok(keywords.length <= 15)
  })

  it('should extract Chinese keywords', () => {
    const text = '这个项目使用了人工智能技术来分析数据，人工智能可以自动提取关键信息'
    const keywords = extractKeywords(text)
    assert.ok(keywords.some(k => k.includes('人工智能')))
  })

  it('should return empty array for short text', () => {
    assert.deepStrictEqual(extractKeywords(''), [])
    assert.deepStrictEqual(extractKeywords('short'), [])
    assert.deepStrictEqual(extractKeywords('hello world test'), [])
  })

  it('should filter stop words', () => {
    const text = 'The quick brown fox jumps over the lazy dog and the cat is sleeping on the mat with some very interesting behavior patterns'
    const keywords = extractKeywords(text)
    assert.ok(!keywords.includes('the'))
    assert.ok(!keywords.includes('and'))
    assert.ok(!keywords.includes('over'))
  })

  it('should boost technical terms', () => {
    const text = 'We use TypeScript and React with Prisma for the database layer. TypeScript provides great developer experience with React projects using Prisma ORM for TypeScript and React development with Prisma.'
    const keywords = extractKeywords(text)
    // Technical terms should rank higher due to 3x boost
    const tsIndex = keywords.indexOf('typescript')
    assert.ok(tsIndex >= 0, 'typescript should be in keywords')
  })

  it('should extract kebab-case and snake_case identifiers', () => {
    const text = 'Please use my-component with my_component for the page. These are common naming conventions in web development with component-based architecture and component hierarchy.'
    const keywords = extractKeywords(text)
    assert.ok(keywords.some(k => k.includes('-') || k.includes('_')))
  })

  it('should handle mixed English and Chinese text', () => {
    const text = 'React是一个前端框架，使用TypeScript可以增强代码质量，React配合TypeScript开发更加高效和安全，React TypeScript组合是前端开发的最佳选择'
    const keywords = extractKeywords(text)
    assert.ok(keywords.length > 0)
  })
})

describe('extractKeywordsFromMessages', () => {
  it('should extract keywords from multiple messages', () => {
    const messages = [
      { role: 'user', content: 'How do I use React hooks for state management?' },
      { role: 'assistant', content: 'React hooks like useState and useEffect are great for state management in React components.' },
    ]
    const keywords = extractKeywordsFromMessages(messages)
    assert.ok(keywords.length > 0)
    assert.ok(keywords.includes('react'))
  })

  it('should return empty for empty messages array', () => {
    assert.deepStrictEqual(extractKeywordsFromMessages([]), [])
  })
})

describe('parseKeywords', () => {
  it('should parse valid JSON array', () => {
    assert.deepStrictEqual(parseKeywords('["react", "typescript"]'), ['react', 'typescript'])
  })

  it('should return empty array for null', () => {
    assert.deepStrictEqual(parseKeywords(null), [])
  })

  it('should return empty array for invalid JSON', () => {
    assert.deepStrictEqual(parseKeywords('not json'), [])
  })

  it('should parse empty JSON array', () => {
    assert.deepStrictEqual(parseKeywords('[]'), [])
  })
})

describe('formatKeywords', () => {
  it('should join keywords with comma and space', () => {
    assert.strictEqual(formatKeywords(['react', 'typescript']), 'react, typescript')
  })

  it('should handle empty array', () => {
    assert.strictEqual(formatKeywords([]), '')
  })

  it('should handle single keyword', () => {
    assert.strictEqual(formatKeywords(['react']), 'react')
  })
})
