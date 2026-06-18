/**
 * Project Analyzer
 *
 * Auto-categorizes conversations into projects based on content.
 * Uses keyword matching for MVP, can be extended with AI.
 */

/**
 * A predefined project category used for conversation classification.
 */
export interface ProjectCategory {
  /** Display name of the category (e.g. "Code Projects"). */
  name: string
  /** Machine-readable category key (e.g. "code", "research"). */
  category: string
  /** Human-readable description of the category scope. */
  description: string
}

// Predefined project categories with keywords
const PROJECT_CATEGORIES: ProjectCategory[] = [
  {
    name: 'Code Projects',
    category: 'code',
    description: 'Software development, coding, and technical projects',
  },
  {
    name: 'Course Work',
    category: 'course',
    description: 'Academic courses, assignments, and learning',
  },
  {
    name: 'Prompt Assets',
    category: 'prompt',
    description: 'Prompt engineering and template creation',
  },
  {
    name: 'Creative Writing',
    category: 'creative',
    description: 'Writing, content creation, and storytelling',
  },
  {
    name: 'Research',
    category: 'research',
    description: 'Research, analysis, and investigation',
  },
  {
    name: 'Business',
    category: 'business',
    description: 'Business strategy, planning, and operations',
  },
  {
    name: 'Data Analysis',
    category: 'data',
    description: 'Data processing, analysis, and visualization',
  },
  {
    name: 'Design',
    category: 'design',
    description: 'UI/UX design, graphics, and visual content',
  },
]

// Keywords for each category
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  code: [
    'codex', 'claude code', 'bug', 'fix', 'debug', 'implement', 'refactor',
    'function', 'class', 'component', 'api', 'endpoint', 'database', 'sql',
    'pages', 'service', 'module', 'package', 'library', 'framework',
    'react', 'vue', 'angular', 'node', 'python', 'java', 'typescript',
    'javascript', 'html', 'css', 'git', 'github', 'deploy', 'build',
    'test', 'unit test', 'integration', 'ci/cd', 'docker', 'kubernetes',
    '小程序', '前端', '后端', '代码', '编程', '开发',
  ],
  course: [
    'essay', 'course', 'assignment', 'quiz', 'professor', 'university',
    'college', 'student', 'homework', 'lecture', 'exam', 'grade',
    'syllabus', 'semester', 'academic', 'thesis', 'dissertation',
    'research paper', 'citation', 'reference', 'study', 'learn',
    '课程', '作业', '论文', '考试', '学习',
  ],
  prompt: [
    'prompt', '提示词', '生成', '改写', '模板', 'template',
    'prompt engineering', 'system prompt', 'user prompt',
    'instruction', 'few-shot', 'zero-shot', 'chain of thought',
    'Prompt 资产', '提示', '优化',
  ],
  creative: [
    'write', 'writing', 'story', 'novel', 'poem', 'creative',
    'content', 'blog', 'article', 'copywriting', 'editorial',
    'narrative', 'character', 'plot', 'dialogue',
    '写作', '创作', '故事', '文章',
  ],
  research: [
    'research', 'analyze', 'analysis', 'study', 'investigate',
    'survey', 'data', 'methodology', 'findings', 'conclusion',
    'literature', 'review', 'comparison', 'evaluation',
    '研究', '分析', '调查',
  ],
  business: [
    'business', 'strategy', 'plan', 'startup', 'company',
    'marketing', 'sales', 'revenue', 'profit', 'customer',
    'product', 'market', 'competition', 'growth',
    '商业', '营销', '策略', '产品',
  ],
  data: [
    'data', 'database', 'sql', 'analytics', 'visualization',
    'chart', 'graph', 'statistics', 'metrics', 'dashboard',
    'excel', 'csv', 'json', 'api', 'etl',
    '数据', '分析', '可视化',
  ],
  design: [
    'design', 'ui', 'ux', 'interface', 'mockup', 'wireframe',
    'figma', 'sketch', 'prototype', 'layout', 'typography',
    'color', 'icon', 'illustration', 'graphic',
    '设计', '界面', '原型',
  ],
}

/**
 * Classify a conversation into a project category using keyword-based scoring.
 * Matches conversation title and content against predefined category keywords.
 *
 * @param title - Conversation title
 * @param messages - Array of messages with `role` and `content` fields
 * @returns The best-matching {@link ProjectCategory}, or "Uncategorized" if no strong match
 */
export function classifyConversation(
  title: string,
  messages: { role: string; content: string }[]
): ProjectCategory {
  const allContent = [
    title,
    ...messages.map(m => m.content),
  ].join(' ').toLowerCase()

  // Calculate scores for each category
  const scores: Record<string, number> = {}

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = allContent.match(regex)
      if (matches) {
        score += matches.length
      }
    }
    scores[category] = score
  }

  // Find the category with highest score
  let bestCategory = 'other'
  let bestScore = 0

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  // If no strong match, return "Uncategorized"
  if (bestScore < 2) {
    return {
      name: 'Uncategorized',
      category: 'other',
      description: 'Conversations that don\'t fit other categories',
    }
  }

  // Find the matching predefined category
  const matchedCategory = PROJECT_CATEGORIES.find(c => c.category === bestCategory)

  return matchedCategory || {
    name: 'Other',
    category: 'other',
    description: 'Other conversations',
  }
}

/**
 * Generate a human-readable project summary from a list of conversations.
 *
 * @param conversations - Array of conversations with `title` and optional `summary`
 * @returns A summary string describing the project's contents
 */
export function generateProjectSummary(conversations: { title: string; summary?: string }[]): string {
  if (conversations.length === 0) {
    return 'No conversations in this project yet.'
  }

  const topics = conversations.slice(0, 5).map(c => c.title)
  const topicList = topics.join(', ')

  return `This project contains ${conversations.length} conversation(s) about: ${topicList}.`
}

/**
 * Extract key progress points from assistant messages using pattern matching.
 * Looks for completion indicators, step markers, and planning phrases.
 *
 * @param messages - Array of messages with `role` and `content` fields
 * @returns Up to 10 progress point strings
 */
export function extractKeyProgress(messages: { role: string; content: string }[]): string[] {
  const progressPoints: string[] = []

  // Look for progress indicators in assistant messages
  for (const message of messages) {
    if (message.role !== 'assistant') continue

    const content = message.content.toLowerCase()

    // Progress indicators
    const progressPatterns = [
      /(?:completed|finished|done|accomplished|achieved)\s+(.{10,50})/gi,
      /(?:step \d+|phase \d+|stage \d+)[:\s]+(.{10,50})/gi,
      /(?:now|next|then)[,\s]+(.{10,80})/gi,
    ]

    for (const pattern of progressPatterns) {
      let match
      while ((match = pattern.exec(message.content)) !== null) {
        const point = match[1]?.trim()
        if (point && !progressPoints.includes(point)) {
          progressPoints.push(point)
        }
      }
    }
  }

  return progressPoints.slice(0, 10)
}

/**
 * Extract TODO/FIXME/action items from conversation messages.
 * Searches for explicit markers and unchecked markdown tasks.
 *
 * @param messages - Array of messages with `role` and `content` fields
 * @returns Up to 10 extracted action item strings
 */
export function extractTodos(messages: { role: string; content: string }[]): string[] {
  const todos: string[] = []

  for (const message of messages) {
    const content = message.content

    // Look for todo patterns
    const todoPatterns = [
      /(?:TODO|FIXME|HACK|XXX)[:\s]+(.{10,100})/gi,
      /(?:need to|should|must|have to)\s+(.{10,80})/gi,
      /(?:next step|action item|task)[:\s]+(.{10,100})/gi,
      /[-*]\s*\[[ ]\]\s*(.{10,100})/gm, // Markdown unchecked tasks
    ]

    for (const pattern of todoPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const todo = match[1]?.trim()
        if (todo && !todos.includes(todo)) {
          todos.push(todo)
        }
      }
    }
  }

  return todos.slice(0, 10)
}
