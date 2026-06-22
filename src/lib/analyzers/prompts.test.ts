import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractPrompts } from './prompts'

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

  it('should extract prompts with Chinese indicators', () => {
    const messages = [
      {
        role: 'user',
        content: '请帮我写一个完整的项目架构设计方案。要求如下：\n1. 项目结构设计\n2. 数据库表设计\n3. API 接口设计\n4. 前端组件设计\n请按照上述要求提供详细的方案，并包含示例代码和最佳实践建议。',
      },
    ]
    const prompts = extractPrompts(messages)
    assert.ok(prompts.length > 0)
  })

  it('should extract embedded prompts', () => {
    const messages = [
      {
        role: 'user',
        content: 'Here is a prompt you can use:\n\nAct as a senior software architect. You will be given a codebase and asked to review it for security vulnerabilities, performance issues, and code quality. Focus on practical, actionable feedback that the development team can implement immediately.',
      },
    ]
    const prompts = extractPrompts(messages)
    assert.ok(prompts.length > 0)
  })

  it('should assign relevant tags', () => {
    const messages = [
      {
        role: 'user',
        content: 'Please write a comprehensive code review checklist for a React TypeScript project. Include testing strategies, performance optimization, and security best practices for the development team.',
      },
    ]
    const prompts = extractPrompts(messages)
    if (prompts.length > 0) {
      assert.ok(prompts[0].tags.length > 0)
    }
  })
})
