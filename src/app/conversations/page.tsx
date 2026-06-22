'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, Loader2, Calendar, Tag, Trash2, CheckSquare, Square, Star } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { useTranslation, useLocale } from '@/i18n/locale-context'

interface Conversation {
  id: string
  title: string
  summary: string | null
  keywords: string | null
  isFavorite: boolean
  messageCount: number
  createdAt: string
  updatedAt: string
  importedAt: string
  projects: { project: { name: string; category: string } }[]
  tags: { tag: { id: string; name: string } }[]
}

export default function ConversationsPage() {
  const { t, locale } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostMessages'>('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [filterFavorites, setFilterFavorites] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchConversations = useCallback(async (currentPage: number, query: string, sort: string, favorites: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: query,
        sortBy: sort,
        favorites: favorites.toString(),
      })

      const response = await fetch(`/api/conversations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data)

        const total = parseInt(response.headers.get('X-Total-Count') || '0')
        const pages = parseInt(response.headers.get('X-Total-Pages') || '1')
        setTotalPages(pages)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setPage(1)
      fetchConversations(1, searchQuery, sortBy, filterFavorites)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery, sortBy, filterFavorites, fetchConversations])

  // Page change effect
  useEffect(() => {
    fetchConversations(page, searchQuery, sortBy, filterFavorites)
  }, [page, fetchConversations, searchQuery, sortBy, filterFavorites])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(conversations.map((c) => c.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(t('conversations.delete-confirm', { count: selectedIds.size }))) return

    setDeleting(true)
    try {
      const response = await fetch('/api/conversations/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (response.ok) {
        setSelectedIds(new Set())
        fetchConversations(page, searchQuery, sortBy, filterFavorites)
      }
    } catch (error) {
      console.error('Failed to delete conversations:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/conversations/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentValue }),
      })
      if (response.ok) {
        setConversations(conversations.map(c =>
          c.id === id ? { ...c, isFavorite: !currentValue } : c
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const isSelectMode = selectedIds.size > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('conversations.title')}</h2>
          <p className="text-muted-foreground">
            {isSelectMode
              ? t('conversations.selected-count', { count: selectedIds.size })
              : t('conversations.subtitle-browse')}
          </p>
        </div>
        {isSelectMode && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('conversations.delete-selected', { count: selectedIds.size })}
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('conversations.search-placeholder')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSortBy('newest'); setPage(1) }}
          >
            {t('conversations.newest')}
          </Button>
          <Button
            variant={sortBy === 'oldest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSortBy('oldest'); setPage(1) }}
          >
            {t('conversations.oldest')}
          </Button>
          <Button
            variant={sortBy === 'mostMessages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setSortBy('mostMessages'); setPage(1) }}
          >
            {t('conversations.most-messages')}
          </Button>
          <Button
            variant={filterFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilterFavorites(!filterFavorites); setPage(1) }}
          >
            <Star className={`h-4 w-4 mr-1 ${filterFavorites ? 'fill-current' : ''}`} />
            {t('conversations.favorites')}
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? t('conversations.no-matching') : t('conversations.no-conversations')}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? t('conversations.try-adjusting')
                : t('conversations.import-first')}
            </p>
            {!searchQuery && (
              <Link
                href="/import"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('conversations.import-conversations')}
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select All */}
          {conversations.length > 0 && (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs"
              >
                {selectedIds.size === conversations.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {selectedIds.size === conversations.length ? t('conversations.deselect-all') : t('conversations.select-all')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t('conversations.n-conversations', { count: conversations.length })}
              </span>
            </div>
          )}

          <div className="space-y-2">
            {conversations.map((conv) => {
              const isSelected = selectedIds.has(conv.id)
              return (
                <div key={conv.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleSelect(conv.id)
                    }}
                    className="flex-shrink-0 p-1 hover:bg-muted rounded"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <Link href={`/conversations/${conv.id}`} className="flex-1">
                    <Card className={`hover:bg-muted/50 transition-colors group ${isSelected ? 'border-primary/50 bg-primary/5' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              {conv.isFavorite && (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                              )}
                              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {conv.title}
                              </h3>
                              <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs">
                                {conv.messageCount} {t('conversations.msgs')}
                              </Badge>
                            </div>
                        {conv.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {conv.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(conv.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}</span>
                          </div>
                          {conv.projects.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>{conv.projects[0].project.name}</span>
                            </div>
                          )}
                          {conv.tags?.slice(0, 3).map(({ tag }) => (
                            <Badge key={tag.id} variant="outline" className="text-xs py-0">
                              {tag.name}
                            </Badge>
                          ))}
                          {conv.keywords && (() => {
                            try {
                              const kw = JSON.parse(conv.keywords) as string[]
                              return kw.slice(0, 2).map((k) => (
                                <Badge key={k} variant="outline" className="text-xs py-0 opacity-60">
                                  {k}
                                </Badge>
                              ))
                            } catch { return null }
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )})}
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </>
    )}
    </div>
  )
}
