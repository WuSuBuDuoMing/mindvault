import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractCodeBlocks, extractCodeBlocksWithStats, getLanguageColor } from './code'

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

describe('language auto-detection', () => {
  it('should detect TypeScript via type annotations', () => {
    const messages = [
      {
        role: 'assistant',
        content: '```\nconst greeting: string = "hello";\nconst count: number = 42;\n```',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks[0].language, 'typescript')
  })

  it('should detect Python patterns', () => {
    const messages = [
      {
        role: 'assistant',
        content: '```\nimport os\nimport sys\ndef main():\n    print("hello")\n```',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks[0].language, 'python')
  })

  it('should detect Rust patterns', () => {
    const messages = [
      {
        role: 'assistant',
        content: '```\nfn main() {\n    let mut x = 5;\n    println!("{}", x);\n}\n```',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks[0].language, 'rust')
  })

  it('should detect Go patterns', () => {
    const messages = [
      {
        role: 'assistant',
        content: '```\npackage main\nimport "fmt"\nfunc main() {\n    fmt.Println("hello")\n}\n```',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks[0].language, 'go')
  })

  it('should detect PHP patterns', () => {
    const messages = [
      {
        role: 'assistant',
        content: '```php\n<?php\n$name = "world";\necho "Hello $name";\n?>\n```',
      },
    ]
    const blocks = extractCodeBlocks(messages)
    assert.strictEqual(blocks[0].language, 'php')
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

  it('should return colors for newly added languages', () => {
    assert.strictEqual(getLanguageColor('php'), '#4F5D95')
    assert.strictEqual(getLanguageColor('ruby'), '#CC342D')
    assert.strictEqual(getLanguageColor('tsx'), '#3178c6')
    assert.strictEqual(getLanguageColor('jsx'), '#f7df1e')
    assert.strictEqual(getLanguageColor('swift'), '#F05138')
    assert.strictEqual(getLanguageColor('kotlin'), '#A97BFF')
  })

  it('should return default color for empty string', () => {
    assert.strictEqual(getLanguageColor(''), '#6b7280')
  })
})

describe('extractCodeBlocksWithStats', () => {
  it('should return blocks and stats together', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Here is some Python:\n```python\ndef hello():\n    print("hi")\n    return True\n```\n\nAnd some JavaScript:\n```js\nconst x = 42;\nconsole.log(x);\n```',
      },
    ]
    const [blocks, stats] = extractCodeBlocksWithStats(messages)
    assert.strictEqual(blocks.length, 2)
    assert.strictEqual(stats.totalBlocks, 2)
    assert.strictEqual(stats.withLanguage, 2)
    assert.ok(stats.languageDistribution['python'] >= 1)
    assert.ok(stats.languageDistribution['javascript'] >= 1)
  })

  it('should count auto-detected blocks', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Check this out:\n```\nSELECT * FROM users WHERE id = 1;\n```',
      },
    ]
    const [blocks, stats] = extractCodeBlocksWithStats(messages)
    assert.strictEqual(blocks.length, 1)
    assert.strictEqual(stats.autoDetected, 1)
    assert.strictEqual(stats.withLanguage, 1) // detected as SQL
  })

  it('should handle empty messages', () => {
    const [blocks, stats] = extractCodeBlocksWithStats([])
    assert.strictEqual(blocks.length, 0)
    assert.strictEqual(stats.totalBlocks, 0)
  })
})
