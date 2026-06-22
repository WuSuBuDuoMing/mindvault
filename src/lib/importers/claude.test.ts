import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  normalizeClaudeExport,
  validateClaudeExport,
  generateImportPreview,
} from './claude.ts'

describe('normalizeClaudeExport', () => {
  it('should parse array of conversations', () => {
    const data = [
      {
        uuid: 'conv-1',
        name: 'Test Conversation',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        chat_messages: [
          { sender: 'human', text: 'Hello', created_at: '2024-01-01T00:00:00Z' },
          { sender: 'assistant', text: 'Hi there!', created_at: '2024-01-01T00:01:00Z' },
        ],
      },
    ]

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].externalId, 'conv-1')
    assert.strictEqual(result[0].title, 'Test Conversation')
    assert.strictEqual(result[0].messages.length, 2)
    assert.strictEqual(result[0].messages[0].role, 'user')
    assert.strictEqual(result[0].messages[1].role, 'assistant')
  })

  it('should parse object with conversations field', () => {
    const data = {
      conversations: [
        {
          id: 'conv-2',
          title: 'Another Conversation',
          messages: [
            { role: 'user', content: 'Test message' },
          ],
        },
      ],
    }

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].externalId, 'conv-2')
  })

  it('should parse single conversation object', () => {
    const data = {
      uuid: 'conv-3',
      name: 'Single Chat',
      chat_messages: [
        { sender: 'human', text: 'Question?' },
        { sender: 'assistant', text: 'Answer!' },
      ],
    }

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].title, 'Single Chat')
  })

  it('should return empty array for invalid data', () => {
    assert.deepStrictEqual(normalizeClaudeExport(null), [])
    assert.deepStrictEqual(normalizeClaudeExport(undefined), [])
    assert.deepStrictEqual(normalizeClaudeExport('string'), [])
    assert.deepStrictEqual(normalizeClaudeExport({}), [])
  })

  it('should skip conversations with no messages', () => {
    const data = [
      { uuid: 'empty', name: 'Empty', chat_messages: [] },
    ]
    assert.deepStrictEqual(normalizeClaudeExport(data), [])
  })

  it('should parse content_blocks format (newer Claude exports)', () => {
    const data = [
      {
        uuid: 'conv-cb',
        name: 'Content Blocks Chat',
        chat_messages: [
          {
            sender: 'human',
            content_blocks: [{ type: 'text', text: 'Hello from blocks' }],
          },
          {
            sender: 'assistant',
            content_blocks: [
              { type: 'text', text: 'Part 1' },
              { type: 'text', text: 'Part 2' },
            ],
          },
        ],
      },
    ]

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].messages[0].content, 'Hello from blocks')
    assert.strictEqual(result[0].messages[1].content, 'Part 1\nPart 2')
  })

  it('should deduplicate messages with same role and content', () => {
    const data = [
      {
        uuid: 'conv-dedup',
        name: 'Dedup Test',
        chat_messages: [
          { sender: 'human', text: 'Hello' },
          { sender: 'human', text: 'Hello' },
          { sender: 'assistant', text: 'Hi!' },
        ],
      },
    ]

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].messages.length, 2)
    assert.strictEqual(result[0].messages[0].role, 'user')
    assert.strictEqual(result[0].messages[1].role, 'assistant')
  })

  it('should parse Unix timestamp dates', () => {
    const data = [
      {
        uuid: 'conv-ts',
        name: 'Timestamp Test',
        created_at: '1704067200', // 2024-01-01T00:00:00Z in seconds
        chat_messages: [
          { sender: 'human', text: 'Hello' },
        ],
      },
    ]

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].createdAt.getFullYear(), 2024)
  })

  it('should call progress callback during normalization', () => {
    const data = [
      { uuid: 'c1', name: 'Chat 1', chat_messages: [{ sender: 'human', text: 'Hi' }] },
      { uuid: 'c2', name: 'Chat 2', chat_messages: [{ sender: 'human', text: 'Hey' }] },
    ]

    const progressEvents: any[] = []
    normalizeClaudeExport(data, (p) => progressEvents.push({ ...p }))

    // Should have: extracting, normalizing (for each or batch), complete
    assert.ok(progressEvents.length >= 3)
    assert.strictEqual(progressEvents[0].phase, 'extracting')
    assert.strictEqual(progressEvents[0].total, 2)
    assert.strictEqual(progressEvents[progressEvents.length - 1].phase, 'complete')
    assert.strictEqual(progressEvents[progressEvents.length - 1].processed, 2)
  })

  it('should parse object with data field', () => {
    const data = {
      data: [
        {
          id: 'conv-data',
          title: 'Data Field',
          messages: [{ role: 'user', content: 'Test' }],
        },
      ],
    }

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].externalId, 'conv-data')
  })

  it('should handle conversations with mixed message formats', () => {
    const data = [
      {
        uuid: 'conv-mixed',
        name: 'Mixed Format',
        chat_messages: [
          { sender: 'human', text: 'First', created_at: '2024-01-01T00:00:00Z' },
          { role: 'assistant', content: 'Second' },
          { sender: 'user', message: 'Third' },
        ],
      },
    ]

    const result = normalizeClaudeExport(data)
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].messages.length, 3)
    assert.strictEqual(result[0].messages[0].content, 'First')
    assert.strictEqual(result[0].messages[1].content, 'Second')
    assert.strictEqual(result[0].messages[2].content, 'Third')
  })
})

describe('validateClaudeExport', () => {
  it('should validate correct data', () => {
    const data = [{ uuid: '1', chat_messages: [{ sender: 'human', text: 'Hi' }] }]
    const result = validateClaudeExport(data)
    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.error, undefined)
  })

  it('should reject null data', () => {
    const result = validateClaudeExport(null)
    assert.strictEqual(result.valid, false)
    assert.strictEqual(result.error, 'No data provided')
  })

  it('should reject non-object data', () => {
    const result = validateClaudeExport('string')
    assert.strictEqual(result.valid, false)
    assert.strictEqual(result.error, 'Data must be an object or array')
  })

  it('should reject empty conversations', () => {
    const result = validateClaudeExport([])
    assert.strictEqual(result.valid, false)
    assert.strictEqual(result.error, 'No conversations found in the data')
  })

  it('should validate nested object with conversations field', () => {
    const data = {
      conversations: [{ uuid: '1', chat_messages: [{ sender: 'human', text: 'Hi' }] }],
    }
    const result = validateClaudeExport(data)
    assert.strictEqual(result.valid, true)
  })

  it('should validate single conversation object', () => {
    const data = { uuid: '1', chat_messages: [{ sender: 'human', text: 'Hi' }] }
    const result = validateClaudeExport(data)
    assert.strictEqual(result.valid, true)
  })
})

describe('generateImportPreview', () => {
  it('should generate preview from valid data', () => {
    const data = [
      {
        uuid: 'c1',
        name: 'Chat 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        chat_messages: [
          { sender: 'human', text: 'Hello world' },
          { sender: 'assistant', text: 'Hi there!' },
        ],
      },
      {
        uuid: 'c2',
        name: 'Chat 2',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        chat_messages: [
          { sender: 'human', text: 'Another question' },
        ],
      },
    ]

    const preview = generateImportPreview(data)
    assert.strictEqual(preview.conversationCount, 2)
    assert.strictEqual(preview.totalMessages, 3)
    assert.deepStrictEqual(preview.sampleTitles, ['Chat 1', 'Chat 2'])
    assert.notStrictEqual(preview.dateRange, null)
  })

  it('should include role distribution in preview', () => {
    const data = [
      {
        uuid: 'c1',
        name: 'Chat',
        chat_messages: [
          { sender: 'human', text: 'Q1' },
          { sender: 'human', text: 'Q2' },
          { sender: 'assistant', text: 'A1' },
        ],
      },
    ]

    const preview = generateImportPreview(data)
    assert.strictEqual(preview.roleDistribution.user, 2)
    assert.strictEqual(preview.roleDistribution.assistant, 1)
  })

  it('should return empty role distribution for empty data', () => {
    const preview = generateImportPreview([])
    assert.strictEqual(preview.conversationCount, 0)
    assert.deepStrictEqual(preview.roleDistribution, {})
  })
})
