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
})
