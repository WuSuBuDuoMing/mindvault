import { describe, it } from 'node:test'
import assert from 'node:assert'
import { classifyConversation, generateProjectSummary } from './projects.ts'

describe('classifyConversation', () => {
  it('should classify code-related conversation', () => {
    const messages = [
      { role: 'user', content: 'How do I implement a React component with TypeScript and API endpoints?' },
      { role: 'assistant', content: 'You can create a function component that calls the API endpoint using fetch.' },
    ]
    const result = classifyConversation('Building a React app', messages)
    assert.strictEqual(result.category, 'code')
  })

  it('should classify writing-related conversation', () => {
    const messages = [
      { role: 'user', content: 'Help me write an essay about creative writing and storytelling techniques for blog articles.' },
      { role: 'assistant', content: 'Here are some writing tips for your article...' },
    ]
    const result = classifyConversation('Writing a blog post', messages)
    assert.strictEqual(result.category, 'creative')
  })

  it('should return uncategorized for ambiguous content', () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you!' },
    ]
    const result = classifyConversation('Random chat', messages)
    assert.strictEqual(result.category, 'other')
    assert.strictEqual(result.name, 'Uncategorized')
  })

  it('should classify data-related conversation', () => {
    const messages = [
      { role: 'user', content: 'I need to analyze data using SQL queries and create a dashboard with visualization charts for analytics metrics.' },
      { role: 'assistant', content: 'Let me help you with data analytics and SQL queries for your dashboard.' },
    ]
    const result = classifyConversation('Data analysis project', messages)
    assert.strictEqual(result.category, 'data')
  })
})

describe('generateProjectSummary', () => {
  it('should generate summary for conversations', () => {
    const conversations = [
      { title: 'React Components' },
      { title: 'API Design' },
      { title: 'Database Schema' },
    ]
    const summary = generateProjectSummary(conversations)
    assert.ok(summary.includes('3 conversation(s)'))
    assert.ok(summary.includes('React Components'))
  })

  it('should handle empty conversations', () => {
    const summary = generateProjectSummary([])
    assert.strictEqual(summary, 'No conversations in this project yet.')
  })
})
