import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  exportConversationToMarkdown,
  exportProjectToMarkdown,
  exportConversationToJSON,
  exportProjectToJSON,
  exportPromptsToJSON,
  exportCodeSnippetsToJSON,
  exportConversationToHTML,
  exportPromptsToHTML,
  exportCodeSnippetsToHTML,
  exportPromptsToCSV,
  exportCodeSnippetsToCSV,
  exportConversationsSummaryToCSV,
  buildExportStatistics,
  generateExportFilename,
  exportConversation,
  exportPrompts,
  exportCodeSnippets,
} from './markdown'

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

describe('exportConversationToJSON', () => {
  it('should produce valid JSON with correct structure', () => {
    const data = {
      title: 'JSON Test',
      summary: 'A summary',
      keywords: ['test'],
      createdAt: new Date('2024-06-15T10:00:00Z'),
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ],
    }

    const json = exportConversationToJSON(data)
    const parsed = JSON.parse(json)

    assert.strictEqual(parsed.format, 'mindvault-conversation')
    assert.strictEqual(parsed.version, '1.0')
    assert.strictEqual(parsed.conversation.title, 'JSON Test')
    assert.strictEqual(parsed.conversation.messageCount, 2)
    assert.strictEqual(parsed.conversation.messages[0].role, 'user')
    assert.ok(parsed.exportedAt)
  })

  it('should handle empty messages', () => {
    const data = {
      title: 'Empty',
      createdAt: new Date('2024-01-01'),
      messages: [],
    }

    const json = exportConversationToJSON(data)
    const parsed = JSON.parse(json)
    assert.strictEqual(parsed.conversation.messageCount, 0)
    assert.deepStrictEqual(parsed.conversation.messages, [])
  })
})

describe('exportProjectToJSON', () => {
  it('should produce valid JSON with conversations', () => {
    const data = {
      name: 'Test Project',
      category: 'code',
      conversations: [
        {
          title: 'Conv 1',
          createdAt: new Date('2024-01-01'),
          messages: [{ role: 'user', content: 'Hello' }],
        },
      ],
    }

    const json = exportProjectToJSON(data)
    const parsed = JSON.parse(json)

    assert.strictEqual(parsed.format, 'mindvault-project')
    assert.strictEqual(parsed.project.name, 'Test Project')
    assert.strictEqual(parsed.project.conversationCount, 1)
  })
})

describe('exportPromptsToJSON', () => {
  it('should export prompts as JSON array', () => {
    const prompts = [
      {
        title: 'Code Reviewer',
        content: 'You are a code reviewer...',
        tags: 'coding, review',
        isFavorite: true,
        createdAt: new Date('2024-01-01'),
        conversationTitle: 'My Chat',
      },
    ]

    const json = exportPromptsToJSON(prompts)
    const parsed = JSON.parse(json)

    assert.strictEqual(parsed.format, 'mindvault-prompts')
    assert.strictEqual(parsed.totalCount, 1)
    assert.strictEqual(parsed.prompts[0].title, 'Code Reviewer')
    assert.strictEqual(parsed.prompts[0].isFavorite, true)
  })
})

describe('exportCodeSnippetsToJSON', () => {
  it('should export code snippets with line count', () => {
    const snippets = [
      {
        language: 'typescript',
        code: 'const x = 1\nconst y = 2',
        description: 'Variables',
        conversationTitle: 'Code Chat',
      },
    ]

    const json = exportCodeSnippetsToJSON(snippets)
    const parsed = JSON.parse(json)

    assert.strictEqual(parsed.format, 'mindvault-code-snippets')
    assert.strictEqual(parsed.totalCount, 1)
    assert.strictEqual(parsed.snippets[0].lineCount, 2)
    assert.strictEqual(parsed.snippets[0].language, 'typescript')
  })
})

describe('exportConversationToHTML', () => {
  it('should produce valid HTML with conversation content', () => {
    const data = {
      title: 'HTML Test',
      summary: 'A test',
      createdAt: new Date('2024-01-01'),
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
    }

    const html = exportConversationToHTML(data)
    assert.ok(html.includes('<!DOCTYPE html>'))
    assert.ok(html.includes('HTML Test'))
    assert.ok(html.includes('class="message user"'))
    assert.ok(html.includes('class="message assistant"'))
    assert.ok(html.includes('Hello'))
    assert.ok(html.includes('Hi there!'))
  })

  it('should escape HTML special characters', () => {
    const data = {
      title: 'Test <script>alert("xss")</script>',
      createdAt: new Date('2024-01-01'),
      messages: [
        { role: 'user', content: 'Hello <b>world</b> & friends' },
      ],
    }

    const html = exportConversationToHTML(data)
    assert.ok(!html.includes('<script>'))
    assert.ok(html.includes('&lt;script&gt;'))
    assert.ok(html.includes('&amp;'))
  })

  it('should include prompts and code snippets when present', () => {
    const data = {
      title: 'Full Export',
      createdAt: new Date('2024-01-01'),
      messages: [],
      prompts: [{ title: 'My Prompt', content: 'Do this', tags: 'test' }],
      codeSnippets: [{ language: 'js', code: 'console.log()', description: 'Log' }],
    }

    const html = exportConversationToHTML(data)
    assert.ok(html.includes('Extracted Prompts'))
    assert.ok(html.includes('Code Snippets'))
    assert.ok(html.includes('My Prompt'))
    assert.ok(html.includes('console.log()'))
  })
})

describe('exportPromptsToHTML', () => {
  it('should render prompt cards', () => {
    const prompts = [
      { title: 'Prompt 1', content: 'Content 1', isFavorite: true, conversationTitle: 'Chat' },
      { title: null, content: 'Content 2' },
    ]

    const html = exportPromptsToHTML(prompts)
    assert.ok(html.includes('Prompt 1'))
    assert.ok(html.includes('Untitled Prompt'))
    assert.ok(html.includes('Content 1'))
    assert.ok(html.includes('Content 2'))
    assert.ok(html.includes('card'))
  })
})

describe('exportCodeSnippetsToHTML', () => {
  it('should render code snippet cards', () => {
    const snippets = [
      { language: 'python', code: 'print("hi")', description: 'Hello script', conversationTitle: 'Chat' },
    ]

    const html = exportCodeSnippetsToHTML(snippets)
    assert.ok(html.includes('Hello script'))
    assert.ok(html.includes('python'))
    // HTML escaping converts quotes to &quot;
    assert.ok(html.includes('print(&quot;hi&quot;)'))
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

  it('should support JSON extension', () => {
    const filename = generateExportFilename('Test', 'conversation', 'json')
    assert.ok(filename.endsWith('.json'))
  })

  it('should support HTML extension', () => {
    const filename = generateExportFilename('Test', 'project', 'html')
    assert.ok(filename.endsWith('.html'))
  })

  it('should support prompts type', () => {
    const filename = generateExportFilename('Library', 'prompts')
    assert.ok(filename.startsWith('prompts-'))
  })

  it('should support code-snippets type', () => {
    const filename = generateExportFilename('Snippets', 'code-snippets', 'json')
    assert.ok(filename.startsWith('code-snippets-'))
    assert.ok(filename.endsWith('.json'))
  })

  it('should support CSV extension', () => {
    const filename = generateExportFilename('Test', 'conversation', 'csv')
    assert.ok(filename.endsWith('.csv'))
  })
})

describe('exportPromptsToCSV', () => {
  it('should produce valid CSV with header and data rows', () => {
    const prompts = [
      {
        title: 'Code Reviewer',
        content: 'You are a code reviewer...',
        tags: 'coding, review',
        isFavorite: true,
        createdAt: new Date('2024-01-01'),
        conversationTitle: 'My Chat',
      },
      {
        title: 'Writer',
        content: 'You are a writer...',
        tags: 'writing',
        isFavorite: false,
        conversationTitle: 'Chat 2',
      },
    ]

    const csv = exportPromptsToCSV(prompts)
    const lines = csv.split('\n')
    assert.strictEqual(lines.length, 3) // header + 2 data rows
    assert.ok(lines[0].includes('Title'))
    assert.ok(lines[0].includes('Content'))
    assert.ok(lines[1].includes('Code Reviewer'))
    assert.ok(lines[2].includes('Writer'))
  })

  it('should handle empty prompts array', () => {
    const csv = exportPromptsToCSV([])
    const lines = csv.split('\n')
    assert.strictEqual(lines.length, 1) // header only
  })

  it('should escape commas in content', () => {
    const prompts = [
      {
        title: 'Test',
        content: 'hello, world',
        isFavorite: false,
      },
    ]
    const csv = exportPromptsToCSV(prompts)
    assert.ok(csv.includes('"hello, world"'))
  })
})

describe('exportCodeSnippetsToCSV', () => {
  it('should produce valid CSV with code snippets', () => {
    const snippets = [
      {
        language: 'typescript',
        code: 'const x = 1\nconst y = 2',
        description: 'Variables',
        conversationTitle: 'Code Chat',
      },
    ]

    const csv = exportCodeSnippetsToCSV(snippets)
    const lines = csv.split('\n')
    assert.strictEqual(lines.length, 2) // header + 1 data row
    assert.ok(lines[0].includes('Language'))
    assert.ok(lines[0].includes('Lines'))
    assert.ok(lines[1].includes('typescript'))
    assert.ok(lines[1].includes('2'))
  })
})

describe('exportConversationsSummaryToCSV', () => {
  it('should produce CSV summary of conversations', () => {
    const conversations = [
      {
        title: 'Conv 1',
        summary: 'Summary 1',
        keywords: ['test', 'code'],
        createdAt: new Date('2024-01-01'),
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
        ],
        prompts: [{ content: 'prompt1', tags: '' }],
      },
    ]

    const csv = exportConversationsSummaryToCSV(conversations)
    const lines = csv.split('\n')
    assert.strictEqual(lines.length, 2)
    assert.ok(lines[0].includes('Title'))
    assert.ok(lines[0].includes('Messages'))
    assert.ok(lines[1].includes('Conv 1'))
    assert.ok(lines[1].includes('2')) // message count
  })
})

describe('buildExportStatistics', () => {
  it('should build correct statistics', () => {
    const content = 'Hello World'
    const stats = buildExportStatistics(content, 'json', 'conversation', 5)

    assert.strictEqual(stats.totalItems, 5)
    assert.strictEqual(stats.format, 'json')
    assert.strictEqual(stats.type, 'conversation')
    assert.ok(stats.sizeBytes > 0)
    assert.ok(stats.exportedAt instanceof Date)
  })

  it('should calculate correct byte size', () => {
    const content = 'ABC'
    const stats = buildExportStatistics(content, 'md', 'prompt', 1)
    // 'ABC' is 3 bytes in UTF-8
    assert.strictEqual(stats.sizeBytes, 3)
  })

  it('should handle Chinese content byte size', () => {
    const content = '你好世界'
    const stats = buildExportStatistics(content, 'md', 'conversation', 1)
    // Each Chinese char is 3 bytes in UTF-8: 4 * 3 = 12
    assert.strictEqual(stats.sizeBytes, 12)
  })
})

describe('exportConversation (unified)', () => {
  it('should export as markdown by default', () => {
    const data = {
      title: 'Test Conv',
      createdAt: new Date('2024-01-01'),
      messages: [{ role: 'user', content: 'Hello' }],
    }
    const result = exportConversation(data)
    assert.strictEqual(result.format, 'md')
    assert.strictEqual(result.contentType, 'conversation')
    assert.ok(result.content.includes('# Test Conv'))
    assert.ok(result.filename.endsWith('.md'))
  })

  it('should export as JSON', () => {
    const data = {
      title: 'JSON Conv',
      createdAt: new Date('2024-01-01'),
      messages: [{ role: 'user', content: 'Hello' }],
    }
    const result = exportConversation(data, 'json')
    assert.strictEqual(result.format, 'json')
    const parsed = JSON.parse(result.content)
    assert.strictEqual(parsed.conversation.title, 'JSON Conv')
  })

  it('should export as HTML', () => {
    const data = {
      title: 'HTML Conv',
      createdAt: new Date('2024-01-01'),
      messages: [{ role: 'user', content: 'Hello' }],
    }
    const result = exportConversation(data, 'html')
    assert.strictEqual(result.format, 'html')
    assert.ok(result.content.includes('<!DOCTYPE html>'))
  })
})

describe('exportPrompts (unified)', () => {
  it('should export prompts as markdown', () => {
    const prompts = [{ title: 'Test Prompt', content: 'Do something', tags: 'coding' }]
    const result = exportPrompts(prompts, 'md')
    assert.strictEqual(result.format, 'md')
    assert.ok(result.content.includes('Test Prompt'))
    assert.ok(result.content.includes('Do something'))
  })

  it('should export prompts as JSON', () => {
    const prompts = [{ title: 'Test', content: 'Content', isFavorite: true }]
    const result = exportPrompts(prompts, 'json')
    const parsed = JSON.parse(result.content)
    assert.strictEqual(parsed.totalCount, 1)
  })
})

describe('exportCodeSnippets (unified)', () => {
  it('should export code snippets as markdown', () => {
    const snippets = [{ language: 'python', code: 'print("hi")', description: 'Hello' }]
    const result = exportCodeSnippets(snippets, 'md')
    assert.strictEqual(result.format, 'md')
    assert.ok(result.content.includes('```python'))
    assert.ok(result.content.includes('print("hi")'))
  })
})
