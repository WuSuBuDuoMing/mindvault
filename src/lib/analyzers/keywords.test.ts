import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractKeywords, extractKeywordsFromMessages, parseKeywords } from './keywords.ts'

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
})
