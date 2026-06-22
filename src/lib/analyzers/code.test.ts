import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractCodeBlocks, getLanguageColor } from './code'

describe('extractCodeBlocks', () => {
  it('should extract markdown code blocks with language', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Here is a function:\n```typescript\nfunction hello(): string {\n  return "world"\n}\n```\nThat is the function.',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks.length, 1)
    assert.strictEqual(blocks[0].language, 'typescript')
    assert.ok(blocks[0].code.includes('function hello'))
  })

  it('should detect language from code content', () => {
    const messages = [
      {
        role: 'assistant',
        content: '```\ndef calculate_sum(numbers):\n    return sum(numbers)\n```',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks.length, 1)
    assert.strictEqual(blocks[0].language, 'python')
  })

  it('should deduplicate identical code blocks', () => {
    const codeBlock = '```js\nconst x = 1;\nconsole.log(x);\n```'
    const messages = [
      { role: 'assistant', content: codeBlock + '\n\n' + codeBlock },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks.length, 1)
  })

  it('should skip short code blocks', () => {
    const messages = [
      { role: 'assistant', content: '```js\nx\n```' },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks.length, 0)
  })

  it('should handle messages with no code blocks', () => {
    const messages = [
      { role: 'user', content: 'What is React?' },
      { role: 'assistant', content: 'React is a JavaScript library.' },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks.length, 0)
  })
})

describe('getLanguageColor', () => {
  it('should return correct colors for known languages', () => {
    assert.strictEqual(getLanguageColor('typescript'), '#3178c6')
    assert.strictEqual(getLanguageColor('python'), '#3776ab')
    assert.strictEqual(getLanguageColor('javascript'), '#f7df1e')
  })

  it('should return default color for unknown language', () => {
    assert.strictEqual(getLanguageColor('unknown'), '#6b7280')
    assert.strictEqual(getLanguageColor(null), '#6b7280')
  })

  it('should return correct colors for more languages', () => {
    assert.strictEqual(getLanguageColor('rust'), '#dea584')
    assert.strictEqual(getLanguageColor('go'), '#00add8')
    assert.strictEqual(getLanguageColor('html'), '#e34c26')
    assert.strictEqual(getLanguageColor('css'), '#563d7c')
    assert.strictEqual(getLanguageColor('sql'), '#e38c00')
    assert.strictEqual(getLanguageColor('bash'), '#4eaa25')
    assert.strictEqual(getLanguageColor('docker'), '#2496ed')
  })

  it('should return default color for empty string', () => {
    assert.strictEqual(getLanguageColor(''), '#6b7280')
  })
})
