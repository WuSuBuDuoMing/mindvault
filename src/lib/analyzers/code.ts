/**
 * Code Analyzer
 *
 * Extracts code blocks from conversation messages.
 * Supports markdown code blocks with language tags and auto-detection.
 * Enhanced with additional language patterns and alias normalization.
 */

/**
 * A code block extracted from conversation content with language metadata.
 */
export interface ExtractedCode {
  /** Detected or normalized programming language (e.g. "typescript", "python"). */
  language: string | null
  /** The raw code content. */
  code: string
  /** Surrounding text that describes what the code does. */
  description: string | null
}

/**
 * Summary statistics for extracted code blocks.
 */
export interface CodeExtractionStats {
  /** Total number of code blocks found. */
  totalBlocks: number
  /** Number of blocks with a detected language. */
  withLanguage: number
  /** Frequency map of detected languages. */
  languageDistribution: Record<string, number>
  /** Number of blocks that were auto-detected (no explicit language tag). */
  autoDetected: number
}

/**
 * Extract code blocks from conversation messages.
 * Supports fenced markdown code blocks with language tags.
 * Deduplicates blocks and skips those shorter than 15 characters.
 *
 * @param messages - Array of messages with `role` and `content` fields
 * @returns Deduplicated array of extracted code blocks with language detection
 */
export function extractCodeBlocks(messages: { role: string; content: string }[]): ExtractedCode[] {
  const codeBlocks: ExtractedCode[] = []
  const seen = new Set<string>()

  for (const message of messages) {
    const extracted = extractCodeFromMessage(message.content)

    for (const block of extracted) {
      // Deduplicate by first 100 chars of code
      const key = block.code.substring(0, 100)
      if (!seen.has(key) && block.code.length >= 15) {
        seen.add(key)
        codeBlocks.push(block)
      }
    }
  }

  return codeBlocks
}

/**
 * Extract code blocks and return them along with extraction statistics.
 *
 * @param messages - Array of messages with `role` and `content` fields
 * @returns Tuple of extracted code blocks and extraction statistics
 */
export function extractCodeBlocksWithStats(
  messages: { role: string; content: string }[]
): [ExtractedCode[], CodeExtractionStats] {
  const codeBlocks = extractCodeBlocks(messages)
  const languageDistribution: Record<string, number> = {}
  let autoDetected = 0

  for (const block of codeBlocks) {
    const lang = block.language || 'unknown'
    languageDistribution[lang] = (languageDistribution[lang] || 0) + 1
  }

  // Count auto-detected: blocks where the original language was null but detection filled it in
  for (const message of messages) {
    const codeBlockPattern = /```(\w*)\n?([\s\S]*?)```/g
    let match
    while ((match = codeBlockPattern.exec(message.content)) !== null) {
      const rawLang = match[1]?.trim() || null
      const code = match[2]?.trim()
      if (code && code.length >= 15 && !rawLang) {
        autoDetected++
      }
    }
  }

  const stats: CodeExtractionStats = {
    totalBlocks: codeBlocks.length,
    withLanguage: codeBlocks.filter(b => b.language !== null).length,
    languageDistribution,
    autoDetected,
  }

  return [codeBlocks, stats]
}

function extractCodeFromMessage(content: string): ExtractedCode[] {
  const blocks: ExtractedCode[] = []

  // Pattern: Markdown code blocks with optional language
  const codeBlockPattern = /```(\w*)\n?([\s\S]*?)```/g
  let match

  while ((match = codeBlockPattern.exec(content)) !== null) {
    const rawLang = match[1]?.trim() || null
    const code = match[2]?.trim()

    if (code && code.length >= 15) {
      const language = normalizeLanguage(rawLang) || detectLanguage(code)
      const description = extractCodeDescription(content, match.index)
      blocks.push({ language, code, description })
    }
  }

  return blocks
}

function normalizeLanguage(lang: string | null): string | null {
  if (!lang) return null

  const normalized = lang.toLowerCase().trim()

  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    fish: 'bash',
    yml: 'yaml',
    md: 'markdown',
    'c#': 'csharp',
    cs: 'csharp',
    'c++': 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    rs: 'rust',
    kt: 'kotlin',
    kts: 'kotlin',
    swift: 'swift',
    objective: 'objective-c',
    objc: 'objective-c',
    pgsql: 'postgresql',
    psql: 'postgresql',
    postgres: 'postgresql',
    ps: 'powershell',
    pwsh: 'powershell',
    dockerfile: 'docker',
    'docker-compose': 'docker',
    tf: 'terraform',
    hcl: 'terraform',
    prisma: 'prisma',
    graphql: 'graphql',
    gql: 'graphql',
    toml: 'toml',
    env: 'env',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    dart: 'dart',
    sol: 'solidity',
    sol: 'solidity',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    r: 'r',
    rmd: 'r',
    lua: 'lua',
    nim: 'nim',
    zig: 'zig',
    v: 'v',
    vba: 'vba',
    groovy: 'groovy',
    gradle: 'groovy',
    makefile: 'makefile',
    cmake: 'cmake',
    vim: 'vim',
    tex: 'latex',
    cls: 'latex',
  }

  return aliases[normalized] || normalized
}

function extractCodeDescription(content: string, codeStartIndex: number): string | null {
  // Look for text before the code block
  const beforeCode = content.substring(Math.max(0, codeStartIndex - 300), codeStartIndex)

  // Find the last meaningful paragraph before code
  const lines = beforeCode.split('\n').filter(l => l.trim())
  const lastLines = lines.slice(-3)

  for (const line of lastLines.reverse()) {
    const trimmed = line.trim()
    // Skip empty lines and code block markers
    if (!trimmed || trimmed.startsWith('```')) continue
    // Skip very short lines (likely formatting)
    if (trimmed.length < 10) continue
    // Skip lines that look like code
    if (/^[{}\[\]()]/.test(trimmed)) continue

    // This looks like a description
    return trimmed.substring(0, 200)
  }

  return null
}

function detectLanguage(code: string): string | null {
  // TypeScript (check before JS for type annotations)
  if (/:\s*(string|number|boolean|any|void|interface|type|Promise|Array|Map)\b/.test(code)) {
    return 'typescript'
  }

  // JavaScript/TypeScript patterns
  if (/\b(const|let|var|function|=>|import|export|require|module\.exports)\b/.test(code)) {
    return 'javascript'
  }

  // Python patterns
  if (/\b(def |class |import |from |if __name__|print\(|range\(|lambda |elif )\b/.test(code)) {
    return 'python'
  }

  // Java patterns
  if (/\b(public|private|protected|class|interface|void|String|int|boolean)\b/.test(code) &&
      /[{};]/.test(code)) {
    return 'java'
  }

  // C/C++ patterns
  if (/\b(#include|printf|scanf|malloc|free|struct|typedef|void\s+\*?)\b/.test(code)) {
    return 'c'
  }

  // C# patterns
  if (/\b(using|namespace|class|public|private|static|void|string|int)\b/.test(code) &&
      /Console\.|using System/.test(code)) {
    return 'csharp'
  }

  // Rust patterns
  if (/\b(fn |let mut|impl |pub |struct |enum |trait |match |unwrap\(\)|->)\b/.test(code)) {
    return 'rust'
  }

  // Go patterns
  if (/\b(func |package |import |fmt\.|:=|goroutine|chan )\b/.test(code)) {
    return 'go'
  }

  // HTML patterns
  if (/<[a-z][\s\S]*>/i.test(code) && /<\/[a-z]+>/i.test(code)) {
    return 'html'
  }

  // CSS patterns
  if (/[{}]/.test(code) && /:\s*[^;]+;/.test(code) && !/[()]/.test(code)) {
    return 'css'
  }

  // SQL patterns
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN)\b/i.test(code)) {
    return 'sql'
  }

  // Shell/Bash patterns
  if (/^\s*\$/.test(code) || /\b(echo|grep|sed|awk|chmod|mkdir|cd|export|source)\b/.test(code)) {
    return 'bash'
  }

  // Go patterns
  if (/\b(func |package |import |fmt\.|:=|goroutine|chan )\b/.test(code)) {
    return 'go'
  }

  // Ruby patterns
  if (/\b(def |end|require|include|class |module |puts |do \|)/.test(code) && /\bend\b/.test(code)) {
    return 'ruby'
  }

  // PHP patterns
  if (/<\?php|\$[a-z_]|\becho\b|->/.test(code) && /function\s+\w+/.test(code)) {
    return 'php'
  }

  // Swift patterns
  if (/\b(func |var |let |guard |if let |self\.|@IBOutlet|struct |class )\b/.test(code) && /->\s*\w+/.test(code)) {
    return 'swift'
  }

  // Kotlin patterns
  if (/\b(fun |val |var |when |data class |sealed class |companion object)\b/.test(code)) {
    return 'kotlin'
  }

  // Lua patterns
  if (/\b(local |function |end|require|print\(|if then)\b/.test(code) && !/\b(public|private)\b/.test(code)) {
    return 'lua'
  }

  // JSON patterns
  if (/^\s*[\[{]/.test(code) && /[\]}]\s*$/.test(code)) {
    try {
      JSON.parse(code)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }

  // YAML patterns
  if (/^\s*[a-z]+:/im.test(code) && !/[{}]/.test(code)) {
    return 'yaml'
  }

  // Markdown patterns
  if (/^#+\s/.test(code) || /^\*\s/.test(code) || /^\[.+\]\(.+\)/.test(code)) {
    return 'markdown'
  }

  // Dockerfile
  if (/^(FROM|RUN|COPY|WORKDIR|CMD|ENTRYPOINT|EXPOSE)\s/m.test(code)) {
    return 'docker'
  }

  // Terraform/HCL
  if (/\b(resource|variable|output|provider|module|terraform)\s+/.test(code)) {
    return 'terraform'
  }

  // Prisma
  if (/\b(model|datasource|generator|enum)\s+/.test(code) && /@@/g.test(code)) {
    return 'prisma'
  }

  return null
}

/**
 * Get the display color hex code for a programming language.
 *
 * @param language - Programming language name (e.g. "typescript", "python")
 * @returns Hex color string for UI display (defaults to gray if unknown)
 */
export function getLanguageColor(language: string | null): string {
  const colors: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3776ab',
    java: '#ed8b00',
    c: '#555555',
    cpp: '#f34b7d',
    csharp: '#178600',
    rust: '#dea584',
    go: '#00add8',
    html: '#e34c26',
    css: '#563d7c',
    sql: '#e38c00',
    bash: '#4eaa25',
    json: '#292929',
    yaml: '#cb171e',
    markdown: '#083fa1',
    docker: '#2496ed',
    terraform: '#7b42bc',
    prisma: '#2d3748',
    graphql: '#e535ab',
    ruby: '#cc342d',
    php: '#777bb4',
    swift: '#f05138',
    kotlin: '#7f52ff',
    scala: '#c22d41',
    r: '#276dc3',
    lua: '#000080',
    dart: '#0175c2',
    vue: '#41b883',
    svelte: '#ff3e00',
    elixir: '#6e4a7e',
    erlang: '#b83998',
    haskell: '#5e5086',
    perl: '#39457e',
    groovy: '#4298b8',
    zig: '#ec915c',
    nim: '#ffc200',
    zig: '#ec915c',
    latex: '#008080',
    makefile: '#427819',
    cmake: '#DA3434',
    solidity: '#363636',
    toml: '#9c4221',
    powershell: '#012456',
  }

  return colors[language || ''] || '#6b7280'
}
