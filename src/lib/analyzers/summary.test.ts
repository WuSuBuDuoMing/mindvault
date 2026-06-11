import { describe, it } from 'node:test'
import assert from 'node:assert'
import { generateSummary } from './summary.ts'

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
})
