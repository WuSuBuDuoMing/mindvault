import { describe, it } from 'node:test'
import assert from 'node:assert'
import { generateSummary, extractKeywords } from './summary.ts'

describe('generateSummary', () => {
  it('should generate summary from user and assistant messages', () => {
    const messages = [
      { role: 'user', content: 'How do I implement a REST API with Node.js and Express?' },
      { role: 'assistant', content: 'To implement a REST API, you need to set up routes and endpoints for your database.' },
    ]
    const result = generateSummary(messages)
    assert.ok(result.summary.length > 0)
    assert.ok(result.keywords.length > 0)
  })

  it('should handle empty messages', () => {
    const result = generateSummary([])
    assert.strictEqual(result.summary, 'Empty conversation')
    assert.deepStrictEqual(result.keywords, [])
  })

  it('should detect code conversation type', () => {
    const messages = [
      { role: 'user', content: 'Help me debug this React component that calls an API endpoint with TypeScript types.' },
      { role: 'assistant', content: 'Let me help you fix the bug in your React component. The function needs proper TypeScript types for the API response.' },
    ]
    const result = generateSummary(messages)
    assert.ok(result.summary.includes('Software development'))
  })

  it('should detect writing conversation type', () => {
    const messages = [
      { role: 'user', content: 'I need to write an article about creative writing and storytelling for my blog content strategy.' },
      { role: 'assistant', content: 'Here are some tips for writing a compelling blog article with strong narrative content.' },
    ]
    const result = generateSummary(messages)
    assert.ok(result.summary.includes('Writing'))
  })

  it('should detect research conversation type', () => {
    const messages = [
      { role: 'user', content: 'Please analyze this research study and help me investigate the survey methodology findings.' },
      { role: 'assistant', content: 'Let me analyze the research findings and methodology from the study.' },
    ]
    const result = generateSummary(messages)
    assert.ok(result.summary.includes('Research'))
  })

  it('should detect learning conversation type', () => {
    const messages = [
      { role: 'user', content: 'Can you explain how to learn programming with a tutorial course?' },
      { role: 'assistant', content: 'Here is a step-by-step tutorial for learning and studying programming.' },
    ]
    const result = generateSummary(messages)
    assert.ok(result.summary.includes('Learning'))
  })

  it('should handle human role name (Claude export format)', () => {
    const messages = [
      { role: 'human', content: 'Tell me about React hooks and components.' },
      { role: 'claude', content: 'React hooks are functions that let you use state in components.' },
    ]
    const result = generateSummary(messages)
    assert.ok(result.summary.length > 0)
    assert.ok(result.keywords.length > 0)
  })
})

describe('extractKeywords (summary)', () => {
  it('should return keywords from combined text', () => {
    const keywords = extractKeywords([
      'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
      'TypeScript provides static type checking for JavaScript code.',
    ])
    assert.ok(keywords.length > 0)
    assert.ok(keywords.includes('typescript'))
  })

  it('should return empty for empty input', () => {
    const keywords = extractKeywords([])
    assert.deepStrictEqual(keywords, [])
  })
})
