/**
 * AI Provider Interface
 *
 * Defines the interface for AI providers.
 * Allows switching between different AI services for enhanced features.
 */

export interface AIProvider {
  name: string
  generateSummary(content: string): Promise<string>
  extractKeywords(content: string): Promise<string[]>
  generateProjectSummary(conversations: { title: string; content: string }[]): Promise<string>
}

export interface AIConfig {
  provider: 'local' | 'openai' | 'anthropic' | 'custom'
  apiKey?: string
  baseUrl?: string
  model?: string
}

// Default local provider (rule-based, no external API)
class LocalAIProvider implements AIProvider {
  name = 'local'

  async generateSummary(content: string): Promise<string> {
    // Use the existing rule-based summary
    const { generateSummary } = await import('@/lib/analyzers/summary')
    const result = generateSummary([{ role: 'user', content }])
    return result.summary
  }

  async extractKeywords(content: string): Promise<string[]> {
    const { extractKeywords } = await import('@/lib/analyzers/summary')
    return extractKeywords([content])
  }

  async generateProjectSummary(conversations: { title: string; content: string }[]): Promise<string> {
    if (conversations.length === 0) {
      return 'No conversations in this project.'
    }

    const topics = conversations.slice(0, 5).map(c => c.title).join(', ')
    return `This project contains ${conversations.length} conversation(s) about: ${topics}.`
  }
}

// OpenAI-compatible provider (for future use)
class OpenAIProvider implements AIProvider {
  name = 'openai'
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey || ''
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
    this.model = config.model || 'gpt-3.5-turbo'
  }

  async generateSummary(content: string): Promise<string> {
    // Placeholder for OpenAI integration
    // In production, this would call the OpenAI API
    console.log('OpenAI generateSummary called (placeholder)')
    return 'AI-generated summary placeholder'
  }

  async extractKeywords(content: string): Promise<string[]> {
    console.log('OpenAI extractKeywords called (placeholder)')
    return []
  }

  async generateProjectSummary(conversations: { title: string; content: string }[]): Promise<string> {
    console.log('OpenAI generateProjectSummary called (placeholder)')
    return 'AI-generated project summary placeholder'
  }
}

// Provider factory
let currentProvider: AIProvider = new LocalAIProvider()

export function getAIProvider(): AIProvider {
  return currentProvider
}

export function configureAIProvider(config: AIConfig): void {
  switch (config.provider) {
    case 'openai':
      currentProvider = new OpenAIProvider(config)
      break
    case 'local':
    default:
      currentProvider = new LocalAIProvider()
      break
  }
}

// Helper functions that use the current provider
export async function aiGenerateSummary(content: string): Promise<string> {
  return currentProvider.generateSummary(content)
}

export async function aiExtractKeywords(content: string): Promise<string[]> {
  return currentProvider.extractKeywords(content)
}

export async function aiGenerateProjectSummary(
  conversations: { title: string; content: string }[]
): Promise<string> {
  return currentProvider.generateProjectSummary(conversations)
}
