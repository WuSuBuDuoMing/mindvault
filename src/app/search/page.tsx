'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Search as SearchIcon, MessageSquare, Sparkles, Code, FolderOpen, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'conversation' | 'prompt' | 'code' | 'project'
  title: string
  description: string
  highlight: string
  relevance: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  return <SearchPageInner initialQuery={initialQuery} />
}

function SearchPageInner({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initialQuery)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Search on mount if query param exists
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
  }, [initialQuery, handleSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return <MessageSquare className="h-5 w-5" />
      case 'prompt':
        return <Sparkles className="h-5 w-5" />
      case 'code':
        return <Code className="h-5 w-5" />
      case 'project':
        return <FolderOpen className="h-5 w-5" />
      default:
        return <SearchIcon className="h-5 w-5" />
    }
  }

  const getTypeLink = (result: SearchResult) => {
    switch (result.type) {
      case 'conversation':
        return `/conversations/${result.id}`
      case 'prompt':
        return `/prompts`
      case 'code':
        return `/code`
      case 'project':
        return `/projects/${result.id}`
      default:
        return '#'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'conversation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'prompt':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'code':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'project':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const filteredResults = typeFilter
    ? results.filter((r) => r.type === typeFilter)
    : results

  const typeCounts = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Search</h2>
        <p className="text-muted-foreground">
          Search across all your conversations, prompts, and code
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search everything..."
          className="pl-10 text-lg py-6"
          value={query}
          onChange={handleInputChange}
          autoFocus
        />
      </div>

      {/* Type Filters */}
      {results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={typeFilter === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            All ({results.length})
          </Button>
          {Object.entries(typeCounts).map(([type, count]) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            >
              {type} ({count})
            </Button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !searched ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search your data</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Enter a keyword to search across conversations, prompts, code snippets, and projects.
            </p>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              No matches found for &quot;{query}&quot;. Try a different search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {filteredResults.length} result(s)
            </p>
            <div className="flex gap-2">
              {['conversation', 'prompt', 'code', 'project'].map((type) => {
                const count = typeCounts[type] || 0
                if (count === 0) return null
                return (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>
          {filteredResults.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={getTypeLink(result)}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-muted-foreground">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">
                          {highlightMatch(result.title, query)}
                        </CardTitle>
                        <Badge className={getTypeBadgeColor(result.type)}>
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.description}
                      </p>
                      {result.highlight && (
                        <p className="text-sm mt-2 line-clamp-2 text-muted-foreground/80">
                          ...{highlightMatch(result.highlight, query)}...
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
