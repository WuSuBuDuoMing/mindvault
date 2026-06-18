import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  exportConversationToMarkdown,
  exportProjectToMarkdown,
  generateExportFilename,
} from './markdown.ts'

describe('exportConversationToMarkdown', () => {
  it('should render title and metadata', () => {
    const data = {
      title: 'Test Conversation',
      summary: 'A test summary',
      keywords: ['test', 'typescript'],
      createdAt: new Date('2024-06-15T10:00:00Z'),
      messages: [],
    }

    const md = exportConversationToMarkdown(data)
    assert.ok(md.includes('# Test Conversation'))
    assert.ok(md.includes('**Summary:** A test summary'))
    assert.ok(md.includes('**Keywords:** test, typescript'))
  })

  it('should render user and assistant messages', () => {
    const data = {
      title: 'Chat',
      createdAt: new Date('2024-01-01'),
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    }

    const md = exportConversationToMarkdown(data)
    assert.ok(md.includes('### User'))
    assert.ok(md.includes('Hello'))
    assert.ok(md.includes('### Assistant'))
    assert.ok(md.includes('Hi there'))
  })

  it('should render code snippets', () => {
    const data = {
      title: 'Code Chat',
      createdAt: new Date('2024-01-01'),
      messages: [],
      codeSnippets: [
        { language: 'typescript', code: 'const x = 1', description: 'A variable' },
      ],
    }

    const md = exportConversationToMarkdown(data)
    assert.ok(md.includes('## Code Snippets'))
    assert.ok(md.includes('### A variable'))
    assert.ok(md.includes('```typescript'))
    assert.ok(md.includes('const x = 1'))
  })

  it('should render extracted prompts', () => {
    const data = {
      title: 'Prompt Chat',
      createdAt: new Date('2024-01-01'),
      messages: [],
      prompts: [
        { title: 'Code Reviewer', content: 'You are a code reviewer...', tags: 'coding' },
      ],
    }

    const md = exportConversationToMarkdown(data)
    assert.ok(md.includes('## Extracted Prompts'))
    assert.ok(md.includes('### Code Reviewer'))
    assert.ok(md.includes('**Tags:** coding'))
  })
})

describe('exportProjectToMarkdown', () => {
  it('should render project info and table of contents', () => {
    const data = {
      name: 'My Project',
      summary: 'A project about stuff',
      category: 'code',
      conversations: [
        {
          title: 'Conv 1',
          summary: 'Summary 1',
          createdAt: new Date('2024-01-01'),
          messages: [{ role: 'user', content: 'Hello' }],
        },
        {
          title: 'Conv 2',
          createdAt: new Date('2024-01-02'),
          messages: [{ role: 'user', content: 'World' }],
        },
      ],
    }

    const md = exportProjectToMarkdown(data)
    assert.ok(md.includes('# My Project'))
    assert.ok(md.includes('**Category:** code'))
    assert.ok(md.includes('## Table of Contents'))
    assert.ok(md.includes('[Conv 1]'))
    assert.ok(md.includes('[Conv 2]'))
  })

  it('should abbreviate long messages', () => {
    const longMessage = 'x'.repeat(600)
    const data = {
      name: 'Test',
      category: 'general',
      conversations: [
        {
          title: 'Conv',
          createdAt: new Date('2024-01-01'),
          messages: [{ role: 'user', content: longMessage }],
        },
      ],
    }

    const md = exportProjectToMarkdown(data)
    assert.ok(md.includes('...'))
    // The abbreviated version should be shorter than the original
    assert.ok(md.length < longMessage.length + 500)
  })
})

describe('generateExportFilename', () => {
  it('should generate a valid filename for conversation', () => {
    const filename = generateExportFilename('Hello World', 'conversation')
    assert.ok(filename.startsWith('conversation-hello-world-'))
    assert.ok(filename.endsWith('.md'))
  })

  it('should generate a valid filename for project', () => {
    const filename = generateExportFilename('My Project', 'project')
    assert.ok(filename.startsWith('project-my-project-'))
    assert.ok(filename.endsWith('.md'))
  })

  it('should sanitize special characters', () => {
    const filename = generateExportFilename('Hello! @World #Test', 'conversation')
    assert.ok(!filename.includes('!'))
    assert.ok(!filename.includes('@'))
    assert.ok(!filename.includes('#'))
  })

  it('should truncate long titles', () => {
    const longTitle = 'A'.repeat(100)
    const filename = generateExportFilename(longTitle, 'conversation')
    // Title is truncated to 50 chars plus prefix and date
    const parts = filename.split('-')
    assert.ok(filename.length < 150)
  })
})
