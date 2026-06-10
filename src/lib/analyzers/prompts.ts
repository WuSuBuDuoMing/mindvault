/**
 * Prompt Analyzer
 *
 * Extracts meaningful, reusable prompts from user messages.
 * Uses multiple heuristics to identify prompt-like content:
 * - Structural indicators (numbered lists, headers, sections)
 * - Role/task patterns ("you are", "act as", "write a")
 * - Length and complexity signals
 * - Explicit prompt markers
 */

export interface ExtractedPrompt {
  title: string
  content: string
  tags: string[]
}

/**
 * Extract prompts from user messages in a conversation
 */
export function extractPrompts(messages: { role: string; content: string }[]): ExtractedPrompt[] {
  const prompts: ExtractedPrompt[] = []
  const seen = new Set<string>()

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'human') continue

    const extracted = extractPromptsFromMessage(message.content)

    // Deduplicate
    for (const prompt of extracted) {
      const key = prompt.content.substring(0, 100).toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        prompts.push(prompt)
      }
    }
  }

  return prompts
}

function extractPromptsFromMessage(content: string): ExtractedPrompt[] {
  const prompts: ExtractedPrompt[] = []

  // Skip very short messages
  if (content.length < 80) {
    return prompts
  }

  // Check if the entire message looks like a prompt
  if (isPromptLike(content)) {
    const title = generatePromptTitle(content)
    const tags = extractPromptTags(content)
    prompts.push({ title, content: content.trim(), tags })
  }

  // Look for embedded prompts (e.g., "Use this prompt: ...", "Write a prompt that...")
  const embeddedPrompts = extractEmbeddedPrompts(content)
  prompts.push(...embeddedPrompts)

  // Look for structured sections that could be prompts
  const structuredPrompts = extractStructuredPrompts(content)
  for (const sp of structuredPrompts) {
    if (!prompts.some(p => p.content.includes(sp.content.substring(0, 50)))) {
      prompts.push(sp)
    }
  }

  return prompts
}

function isPromptLike(content: string): boolean {
  const lowerContent = content.toLowerCase()

  // Strong prompt indicators (role/task definitions)
  const strongIndicators = [
    /you are (?:a |an )?\w/i,
    /act as (?:a |an )?\w/i,
    /pretend (?:you are|to be)/i,
    /(?:write|create|generate|build) (?:a |an )?(?:prompt|template|script)/i,
    /(?:system|user) prompt/i,
    /prompt(?:\s*[:：])/i,
    /(?:请|帮我|我需要) (?:写|创建|生成|设计)/,
    /你现在是/,
    /你的(?:角色|任务|目标)(?:是|为)/,
  ]

  const hasStrongIndicator = strongIndicators.some(pattern => pattern.test(content))

  // Medium indicators (task descriptions)
  const mediumIndicators = [
    /please (?:write|create|generate|help|analyze|explain|describe)/i,
    /can you (?:write|create|generate|help|analyze|explain|describe)/i,
    /i (?:want|need) (?:you|to)/i,
    /(?:write|create|generate) (?:a |an |me )?.{10,}/i,
    /(?:explain|describe|analyze|summarize|compare|list) .{10,}/i,
    /(?:how to|how do i|what is|why does)/i,
    /(?:请|帮我|我想|我需要)/,
  ]

  const hasMediumIndicator = mediumIndicators.some(pattern => pattern.test(content))

  // Structure indicators
  const hasNumberedSteps = /\d+\.\s/.test(content) && (content.match(/\d+\.\s/g) || []).length >= 2
  const hasBulletPoints = /^[-*]\s/m.test(content) && (content.match(/^[-*]\s/gm) || []).length >= 2
  const hasSections = /#{1,3}\s/.test(content) || (content.includes('\n\n') && content.split('\n\n').length >= 3)
  const hasRequirements = /(?:要求|requirements?|constraints?|rules?|format)[:\s]/i.test(content)
  const hasOutputFormat = /(?:output|format|template|example)[:\s]/i.test(content)

  const hasStructure = hasNumberedSteps || hasBulletPoints || hasSections || hasRequirements || hasOutputFormat

  // Length-based scoring
  const isLong = content.length >= 200
  const isVeryLong = content.length >= 500

  // Scoring logic
  if (hasStrongIndicator && (isLong || hasStructure)) return true
  if (hasMediumIndicator && isVeryLong) return true
  if (hasStructure && isLong && content.split('\n').length >= 5) return true
  if (isVeryLong && hasRequirements && hasOutputFormat) return true

  return false
}

function generatePromptTitle(content: string): string {
  // Try to find a title-like line
  const lines = content.split('\n').filter(l => l.trim())

  // Check for markdown header
  const headerLine = lines.find(l => /^#{1,3}\s/.test(l))
  if (headerLine) {
    return headerLine.replace(/^#+\s*/, '').substring(0, 60).trim()
  }

  // Check for first non-question line
  const firstLine = lines[0] || content

  // Clean up the title
  const cleaned = firstLine
    .replace(/^(please|can you|could you|help me|i want to|i need to|请|帮我|我想|我需要)\s*/i, '')
    .trim()
    .substring(0, 60)

  return cleaned + (cleaned.length < firstLine.length ? '...' : '')
}

function extractPromptTags(content: string): string[] {
  const tags: string[] = []
  const lowerContent = content.toLowerCase()

  // Topic tags
  const topicPatterns = [
    { pattern: /code|programming|software|developer|api|component/i, tag: 'coding' },
    { pattern: /write|writing|essay|article|blog|content/i, tag: 'writing' },
    { pattern: /research|analyze|study|investigate|review/i, tag: 'research' },
    { pattern: /learn|course|tutorial|education|explain/i, tag: 'learning' },
    { pattern: /design|ui|ux|interface|figma|mockup/i, tag: 'design' },
    { pattern: /data|database|sql|analytics|visualization/i, tag: 'data' },
    { pattern: /marketing|seo|social|brand/i, tag: 'marketing' },
    { pattern: /business|strategy|plan|startup|product/i, tag: 'business' },
    { pattern: /creative|idea|brainstorm|story/i, tag: 'creative' },
    { pattern: /test|debug|fix|troubleshoot|error/i, tag: 'debugging' },
    { pattern: /prompt|提示词|template/i, tag: 'prompt-engineering' },
  ]

  for (const { pattern, tag } of topicPatterns) {
    if (pattern.test(lowerContent)) {
      tags.push(tag)
    }
  }

  // Action tags
  const actionPatterns = [
    { pattern: /create|build|make|develop|implement/i, tag: 'creation' },
    { pattern: /fix|debug|solve|troubleshoot/i, tag: 'problem-solving' },
    { pattern: /explain|describe|clarify|teach/i, tag: 'explanation' },
    { pattern: /improve|optimize|enhance|refactor/i, tag: 'optimization' },
    { pattern: /review|feedback|evaluate|assess/i, tag: 'review' },
    { pattern: /summarize|summary|overview/i, tag: 'summarization' },
    { pattern: /compare|contrast|difference/i, tag: 'comparison' },
    { pattern: /list|enumerate|catalog/i, tag: 'listing' },
  ]

  for (const { pattern, tag } of actionPatterns) {
    if (pattern.test(lowerContent)) {
      tags.push(tag)
    }
  }

  // Format tags
  if (/json|xml|csv|markdown/i.test(content)) tags.push('structured-output')
  if (/code|```/i.test(content)) tags.push('code-generation')
  if (/table|list|bullet/i.test(content)) tags.push('formatted')

  return [...new Set(tags)].slice(0, 5)
}

function extractEmbeddedPrompts(content: string): ExtractedPrompt[] {
  const prompts: ExtractedPrompt[] = []

  // Look for explicit prompt patterns
  const promptPatterns = [
    /(?:use this prompt|prompt[:\s]+|here'?s? (?:a |the )?prompt)[:\s]+([\s\S]*?)(?:\n\n|\n(?=[A-Z])|$)/gi,
    /(?:写一个 prompt|提示词[:\s]+|prompt[:\s：]+)([\s\S]*?)(?:\n\n|\n(?=[一-鿿])|$)/gi,
  ]

  for (const pattern of promptPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const promptContent = match[1]?.trim()
      if (promptContent && promptContent.length >= 30) {
        prompts.push({
          title: generatePromptTitle(promptContent),
          content: promptContent,
          tags: extractPromptTags(promptContent),
        })
      }
    }
  }

  return prompts
}

function extractStructuredPrompts(content: string): ExtractedPrompt[] {
  const prompts: ExtractedPrompt[] = []

  // Look for structured sections that could be standalone prompts
  // Pattern: a section that starts with a header-like line and has substantial content
  const sections = content.split(/\n\n+/)

  let currentSection = ''
  let sectionStart = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim()

    // Check if this section starts a new prompt-like block
    const isSectionStart = /^(?:#{1,3}\s|(?:(?:write|create|generate|build|please|can you)\b))/i.test(section) ||
      /^(?:写|创建|生成|请)/i.test(section)

    if (isSectionStart && currentSection.length >= 100) {
      // Save previous section as a prompt
      prompts.push({
        title: generatePromptTitle(currentSection),
        content: currentSection.trim(),
        tags: extractPromptTags(currentSection),
      })
      currentSection = section
    } else {
      currentSection += (currentSection ? '\n\n' : '') + section
    }
  }

  // Don't forget the last section
  if (currentSection.length >= 200 && isPromptLike(currentSection)) {
    prompts.push({
      title: generatePromptTitle(currentSection),
      content: currentSection.trim(),
      tags: extractPromptTags(currentSection),
    })
  }

  return prompts
}
