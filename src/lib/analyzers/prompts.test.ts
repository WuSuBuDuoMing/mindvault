import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractPrompts } from './prompts.ts'

describe('extractPrompts', () => {
  it('should extract prompt-like messages', () => {
    const messages = [
      {
        role: 'user',
        content: 'Please write a comprehensive guide about React hooks. Include the following requirements:\n1. useState usage with examples\n2. useEffect patterns\n3. Custom hooks creation\n4. Performance optimization tips\n\nThe output should be formatted as a tutorial with code examples and explanations for each section.',
      },
    ]
    const prompts = extractPrompts(messages)
    assert.ok(prompts.length > 0)
    assert.ok(prompts[0].content.includes('React hooks'))
  })

  it('should not extract short messages as prompts', () => {
    const messages = [
      { role: 'user', content: 'What is React?' },
      { role: 'assistant', content: 'React is a JavaScript library for building user interfaces.' },
    ]
    const prompts = extractPrompts(messages)
    assert.strictEqual(prompts.length, 0)
  })

  it('should not extract assistant messages as prompts', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'You are a helpful assistant. Please write a comprehensive guide about React hooks with detailed examples and code snippets for each concept. Include the following requirements:\n1. useState\n2. useEffect\n3. Custom hooks\n4. Performance tips',
      },
    ]
    const prompts = extractPrompts(messages)
    assert.strictEqual(prompts.length, 0)
  })

  it('should extract prompts with strong indicators', () => {
    const messages = [
      {
        role: 'user',
        content: 'You are a senior software engineer. Act as a code reviewer and analyze the following code for potential issues, performance problems, and best practices violations. Please provide detailed feedback with specific suggestions for improvement.',
      },
    ]
    const prompts = extractPrompts(messages)
    assert.ok(prompts.length > 0)
  })

  it('should deduplicate similar prompts', () => {
    const longPrompt = 'Please write a comprehensive tutorial about TypeScript generics. Include the following requirements:\n1. Basic generic types\n2. Generic constraints\n3. Generic utility types\n4. Advanced patterns with code examples'
    const messages = [
      { role: 'user', content: longPrompt },
      { role: 'user', content: longPrompt },
    ]
    const prompts = extractPrompts(messages)
    assert.strictEqual(prompts.length, 1)
  })
})
