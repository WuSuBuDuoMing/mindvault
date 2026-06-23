import { describe, it } from 'node:test'
import assert from 'node:assert'
import { classifyConversation, classifyConversationDetailed, generateProjectSummary, extractKeyProgress, extractTodos } from './projects'

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

  it('should classify research conversation', () => {
    const messages = [
      { role: 'user', content: 'Please analyze this research study and investigate the survey methodology findings from the literature review.' },
      { role: 'assistant', content: 'Let me analyze the research methodology and evaluation findings.' },
    ]
    const result = classifyConversation('Research project', messages)
    assert.strictEqual(result.category, 'research')
  })

  it('should classify business conversation', () => {
    const messages = [
      { role: 'user', content: 'Help me develop a business strategy for marketing our product to increase revenue and customer growth.' },
      { role: 'assistant', content: 'Here is a business plan focusing on product market growth and sales strategy.' },
    ]
    const result = classifyConversation('Business planning', messages)
    assert.strictEqual(result.category, 'business')
  })

  it('should classify design conversation', () => {
    const messages = [
      { role: 'user', content: 'I need help with UI design, creating wireframes and mockup prototypes for the interface layout.' },
      { role: 'assistant', content: 'Here is a Figma prototype layout for your UI interface.' },
    ]
    const result = classifyConversation('UI Design', messages)
    assert.strictEqual(result.category, 'design')
  })

  it('should classify DevOps conversation', () => {
    const messages = [
      { role: 'user', content: 'Help me set up a CI/CD pipeline with Docker container deployment on AWS infrastructure.' },
      { role: 'assistant', content: 'Let me help you configure the deployment pipeline with Kubernetes orchestration.' },
    ]
    const result = classifyConversation('DevOps Setup', messages)
    assert.strictEqual(result.category, 'devops')
  })

  it('should classify security conversation', () => {
    const messages = [
      { role: 'user', content: 'Please perform a security audit of the authentication system and check for vulnerability issues.' },
      { role: 'assistant', content: 'I will analyze the encryption and firewall configuration for compliance.' },
    ]
    const result = classifyConversation('Security Review', messages)
    assert.strictEqual(result.category, 'security')
  })

  it('should classify translation conversation', () => {
    const messages = [
      { role: 'user', content: 'Please translate this technical documentation from English to Chinese. We need localization for the i18n system.' },
      { role: 'assistant', content: 'Here is the translated and localized version of the documentation.' },
    ]
    const result = classifyConversation('Translation Work', messages)
    assert.strictEqual(result.category, 'translation')
  })
})

describe('classifyConversationDetailed', () => {
  it('should return category with confidence and scores', () => {
    const messages = [
      { role: 'user', content: 'How do I implement a React component with TypeScript and API endpoints?' },
      { role: 'assistant', content: 'You can create a function component that calls the API endpoint using fetch.' },
    ]
    const result = classifyConversationDetailed('Building a React app', messages)
    assert.strictEqual(result.category.category, 'code')
    assert.ok(result.confidence > 0)
    assert.ok(typeof result.scores === 'object')
    assert.ok(result.scores['code'] > 0)
  })

  it('should return zero confidence for uncategorized', () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you!' },
    ]
    const result = classifyConversationDetailed('Random chat', messages)
    assert.strictEqual(result.category.category, 'other')
    assert.strictEqual(result.confidence, 0)
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

  it('should handle single conversation', () => {
    const summary = generateProjectSummary([{ title: 'Only One' }])
    assert.ok(summary.includes('1 conversation(s)'))
    assert.ok(summary.includes('Only One'))
  })
})

describe('extractKeyProgress', () => {
  it('should extract progress from assistant messages', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Step 1: We completed the database schema design.\nStep 2: Now let me build the API endpoints for the user service.',
      },
    ]
    const progress = extractKeyProgress(messages)
    assert.ok(progress.length > 0)
  })

  it('should not extract progress from user messages', () => {
    const messages = [
      {
        role: 'user',
        content: 'Please complete the implementation of the dashboard.',
      },
    ]
    const progress = extractKeyProgress(messages)
    assert.strictEqual(progress.length, 0)
  })
})

describe('extractTodos', () => {
  it('should extract TODO markers', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Here is the plan:\n- TODO: implement the login feature\n- FIXME: fix the broken test',
      },
    ]
    const todos = extractTodos(messages)
    assert.ok(todos.length > 0)
  })

  it('should extract unchecked markdown tasks', () => {
    const messages = [
      {
        role: 'user',
        content: 'Checklist:\n- [ ] Write unit tests\n- [ ] Add error handling',
      },
    ]
    const todos = extractTodos(messages)
    assert.ok(todos.length > 0)
  })

  it('should extract action items', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'You need to complete the database migration before the next step.',
      },
    ]
    const todos = extractTodos(messages)
    assert.ok(todos.length > 0)
  })
})
