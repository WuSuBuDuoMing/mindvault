'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Search, Copy, Star, StarOff, Loader2, MessageSquare, Filter, Download } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { useTranslation, useLocale } from '@/i18n/locale-context'

interface PromptItem {
  id: string
  title: string | null
  content: string
  tags: string | null
  isFavorite: boolean
  createdAt: string
  conversation: {
    id: string
    title: string
  }
}

export default function PromptsPage() {
  const { t, locale } = useTranslation()
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
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

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentValue }),
      })
      if (response.ok) {
        setPrompts(prompts.map(p =>
          p.id === id ? { ...p, isFavorite: !currentValue } : p
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/prompts/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prompts-${new Date().toISOString().split('T')[0]}.md`
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

  // Get all unique tags
  const allTags = [...new Set(
    prompts
      .flatMap(p => p.tags ? JSON.parse(p.tags) : [])
      .filter(Boolean)
  )].sort()

  const filteredPrompts = prompts.filter((prompt) => {
    // Text search
    const matchesSearch = !searchQuery ||
      prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())

    // Favorites filter
    const matchesFavorite = !filterFavorites || prompt.isFavorite

    // Tag filter
    const matchesTag = !selectedTag ||
      (prompt.tags && JSON.parse(prompt.tags).includes(selectedTag))

    return matchesSearch && matchesFavorite && matchesTag
  })

  const totalPages = Math.ceil(filteredPrompts.length / pageSize)
  const paginatedPrompts = filteredPrompts.slice((page - 1) * pageSize, page * pageSize)

  const parseTags = (tagsJson: string | null): string[] => {
    if (!tagsJson) return []
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('prompts.title')}</h2>
          <p className="text-muted-foreground">
            {t('prompts.subtitle')}
          </p>
        </div>
        {prompts.length > 0 && (
          <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {t('prompts.export-all')}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('prompts.search-placeholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            />
          </div>
          <Button
            variant={filterFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilterFavorites(!filterFavorites); setPage(1) }}
            className="flex items-center gap-2"
          >
            <Star className={`h-4 w-4 ${filterFavorites ? 'fill-current' : ''}`} />
            {t('prompts.favorites')}
          </Button>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={selectedTag === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => { setSelectedTag(null); setPage(1) }}
              className="h-7 text-xs"
            >
              {t('prompts.all')}
            </Button>
            {allTags.slice(0, 10).map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setPage(1) }}
                className="h-7 text-xs"
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{t('prompts.n-prompts', { count: filteredPrompts.length })}</span>
          {filterFavorites && <span>• {t('prompts.showing-favorites')}</span>}
          {selectedTag && <span>• {t('prompts.tagged', { tag: selectedTag })}</span>}
        </div>
      )}

      {/* Prompts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filterFavorites || selectedTag
                ? t('prompts.no-matching')
                : t('prompts.no-prompts')}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery || filterFavorites || selectedTag
                ? t('prompts.try-adjusting')
                : t('prompts.auto-extracted')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedPrompts.map((prompt) => {
            const tags = parseTags(prompt.tags)
            return (
              <Card key={prompt.id} className={prompt.isFavorite ? 'border-yellow-200 dark:border-yellow-800' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {prompt.isFavorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        )}
                        <CardTitle className="text-base">
                          {prompt.title || t('prompts.untitled-prompt')}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {expandedId === prompt.id || prompt.content.length <= 200 ? (
                          <pre className="whitespace-pre-wrap font-sans">{prompt.content}</pre>
                        ) : (
                          <>
                            {prompt.content.substring(0, 200)}...
                            <button
                              type="button"
                              onClick={() => setExpandedId(prompt.id)}
                              className="text-primary hover:underline ml-1"
                            >
                              {t('prompts.show-more')}
                            </button>
                          </>
                        )}
                        {expandedId === prompt.id && prompt.content.length > 200 && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            className="text-primary hover:underline mt-1 block"
                          >
                            {t('prompts.show-less')}
                          </button>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleFavorite(prompt.id, prompt.isFavorite)}
                        title={prompt.isFavorite ? t('prompts.remove-favorites') : t('prompts.add-favorites')}
                      >
                        {prompt.isFavorite ? (
                          <StarOff className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(prompt.content, prompt.id)}
                        title={t('prompts.copy-prompt')}
                      >
                        {copiedId === prompt.id ? (
                          <Copy className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/conversations/${prompt.conversation.id}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{prompt.conversation.title}</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-secondary/80"
                          onClick={() => { setSelectedTag(tag); setPage(1) }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {new Date(prompt.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredPrompts.length > pageSize && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
