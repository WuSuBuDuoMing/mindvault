'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Tag, Sparkles, Code, Copy, Check, Loader2, Hash, Plus, X, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string | null
  orderIndex: number
}

interface PromptItem {
  id: string
  title: string | null
  content: string
  tags: string | null
}

interface CodeSnippet {
  id: string
  language: string | null
  code: string
  description: string | null
}

interface Conversation {
  id: string
  title: string
  summary: string | null
  keywords: string | null
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  messageCount: number
  messages: Message[]
  prompts: PromptItem[]
  codeSnippets: CodeSnippet[]
  projects: { project: { name: string; category: string } }[]
  tags: { tag: { id: string; name: string } }[]
}

export default function ConversationDetailPage() {
  const params = useParams()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [addingTag, setAddingTag] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchConversation(params.id as string)
    }
  }, [params.id])

  const fetchConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setConversation(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleExport = async () => {
    if (!conversation) return

    setExporting(true)
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversation-${conversation.id}.md`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleAddTag = async () => {
    if (!conversation || !newTag.trim()) return

    setAddingTag(true)
    try {
      const currentTags = conversation.tags.map(t => t.tag.name)
      const updatedTags = [...currentTags, newTag.trim().toLowerCase()]

      const response = await fetch(`/api/conversations/${conversation.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      })

      if (response.ok) {
        // Refresh conversation data
        fetchConversation(conversation.id)
        setNewTag('')
      }
    } catch (error) {
      console.error('Failed to add tag:', error)
    } finally {
      setAddingTag(false)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!conversation) return

    try {
      const currentTags = conversation.tags
        .filter(t => t.tag.id !== tagId)
        .map(t => t.tag.name)

      const response = await fetch(`/api/conversations/${conversation.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: currentTags }),
      })

      if (response.ok) {
        // Refresh conversation data
        fetchConversation(conversation.id)
      }
    } catch (error) {
      console.error('Failed to remove tag:', error)
    }
  }

  const getRoleConfig = (role: string) => {
    switch (role.toLowerCase()) {
      case 'user':
      case 'human':
        return {
          label: 'User',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          bubbleClass: 'bg-blue-50 dark:bg-blue-950/30',
          icon: '👤',
        }
      case 'assistant':
      case 'claude':
        return {
          label: 'Assistant',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          bubbleClass: 'bg-green-50 dark:bg-green-950/30',
          icon: '🤖',
        }
      case 'system':
        return {
          label: 'System',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          bubbleClass: 'bg-gray-50 dark:bg-gray-900/30',
          icon: '⚙️',
        }
      default:
        return {
          label: role,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          bubbleClass: 'bg-gray-50 dark:bg-gray-900/30',
          icon: '💬',
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/conversations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Conversation Not Found</h2>
            <p className="text-muted-foreground">
              This conversation doesn&apos;t exist or hasn&apos;t been imported yet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/conversations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{conversation.title}</h2>
            <p className="text-sm text-muted-foreground">
              {conversation.messageCount} messages • Created{' '}
              {new Date(conversation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!conversation) return
              try {
                const response = await fetch(`/api/conversations/${conversation.id}/favorite`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isFavorite: !conversation.isFavorite }),
                })
                if (response.ok) {
                  setConversation({ ...conversation, isFavorite: !conversation.isFavorite })
                }
              } catch (error) {
                console.error('Failed to toggle favorite:', error)
              }
            }}
          >
            <Star className={`mr-2 h-4 w-4 ${conversation.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {conversation.isFavorite ? 'Favorited' : 'Favorite'}
          </Button>
          <Button onClick={handleExport} disabled={exporting} size="sm">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Markdown
          </Button>
        </div>
      </div>

      {/* Summary & Keywords */}
      {(conversation.summary || conversation.keywords) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversation.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{conversation.summary}</p>
            )}
            {conversation.keywords && (
              <div className="flex items-start gap-2 flex-wrap">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                {JSON.parse(conversation.keywords).map((kw: string) => (
                  <Badge key={kw} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
            {conversation.projects.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {conversation.projects.map((cp) => (
                  <Badge key={cp.project.name} variant="secondary">
                    {cp.project.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {conversation.tags?.length > 0 ? (
              conversation.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1 hover:text-destructive"
                    title={`Remove tag: ${tag.name}`}
                    aria-label={`Remove tag: ${tag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tags added yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="max-w-xs"
            />
            <Button
              onClick={handleAddTag}
              disabled={!newTag.trim() || addingTag}
              size="sm"
            >
              {addingTag ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversation</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{conversation.messages.filter(m => m.role === 'user').length} user</span>
              <span>•</span>
              <span>{conversation.messages.filter(m => m.role === 'assistant').length} assistant</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversation.messages.map((message, index) => {
            const role = getRoleConfig(message.role)
            const wordCount = message.content.split(/\s+/).length
            return (
              <div
                key={message.id}
                id={`msg-${index}`}
                className={`rounded-lg border ${role.bubbleClass} overflow-hidden`}
              >
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{role.icon}</span>
                    <Badge variant="outline" className={role.className}>{role.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {wordCount} words
                    </span>
                    {message.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(message.content, message.id)}
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {message.role === 'assistant' || message.role === 'claude' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {message.content}
                    </pre>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Extracted Prompts */}
      {conversation.prompts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Extracted Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversation.prompts.map((prompt) => (
              <div key={prompt.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    {prompt.title && (
                      <h4 className="font-medium text-sm">{prompt.title}</h4>
                    )}
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground break-words">
                      {prompt.content}
                    </pre>
                    {prompt.tags && (
                      <div className="flex gap-2 flex-wrap">
                        {JSON.parse(prompt.tags).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 ml-2"
                    onClick={() => handleCopy(prompt.content, prompt.id)}
                  >
                    {copiedId === prompt.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Code Snippets */}
      {conversation.codeSnippets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              Code Snippets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversation.codeSnippets.map((snippet) => (
              <div key={snippet.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {snippet.language && (
                      <Badge variant="secondary" className="text-xs">
                        {snippet.language}
                      </Badge>
                    )}
                    {snippet.description && (
                      <span className="text-sm text-muted-foreground">
                        {snippet.description}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                  >
                    {copiedId === snippet.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted overflow-hidden">
                  <div className="flex">
                    <div className="flex-shrink-0 py-4 pl-3 pr-2 text-right border-r bg-muted/50 select-none">
                      {snippet.code.split('\n').map((_, i) => (
                        <div key={i} className="text-xs text-muted-foreground/50 leading-5">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <pre className="flex-1 p-4 overflow-x-auto text-sm">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
