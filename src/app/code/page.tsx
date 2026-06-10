'use client'

import { useState, useEffect } from 'react'
import { Code, Search, Copy, Check, Loader2, MessageSquare, Filter, Download } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'

interface CodeSnippet {
  id: string
  language: string | null
  code: string
  description: string | null
  createdAt: string
  conversation: {
    id: string
    title: string
  }
}

export default function CodePage() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    fetchSnippets()
  }, [])

  const fetchSnippets = async () => {
    try {
      const response = await fetch('/api/code')
      if (response.ok) {
        const data = await response.json()
        setSnippets(data)
      }
    } catch (error) {
      console.error('Failed to fetch code snippets:', error)
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
    setExporting(true)
    try {
      const response = await fetch('/api/code/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `code-snippets-${new Date().toISOString().split('T')[0]}.md`
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

  // Get unique languages for filter, sorted by count
  const languageCounts = snippets.reduce((acc, s) => {
    const lang = s.language || 'unknown'
    acc[lang] = (acc[lang] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const languages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)

  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch = !searchQuery ||
      snippet.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.language?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLanguage = !languageFilter || snippet.language === languageFilter

    return matchesSearch && matchesLanguage
  })

  const totalPages = Math.ceil(filteredSnippets.length / pageSize)
  const paginatedSnippets = filteredSnippets.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Code Snippets</h2>
          <p className="text-muted-foreground">
            Code blocks extracted from conversations
          </p>
        </div>
        {snippets.length > 0 && (
          <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export All
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search code..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Language Filter */}
        {languages.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={languageFilter === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => { setLanguageFilter(null); setPage(1) }}
              className="h-7 text-xs"
            >
              All ({snippets.length})
            </Button>
            {languages.slice(0, 8).map((lang) => (
              <Button
                key={lang}
                variant={languageFilter === lang ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setLanguageFilter(languageFilter === lang ? null : lang); setPage(1) }}
                className="h-7 text-xs"
              >
                {lang} ({languageCounts[lang]})
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{filteredSnippets.length} snippet(s)</span>
          {languageFilter && <span>• Language: {languageFilter}</span>}
          {searchQuery && <span>• Matching: &quot;{searchQuery}&quot;</span>}
        </div>
      )}

      {/* Code Snippets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSnippets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || languageFilter ? 'No matching snippets' : 'No code snippets yet'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery || languageFilter
                ? 'Try adjusting your search or filter'
                : 'Code blocks are automatically extracted from your conversations when you import data.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedSnippets.map((snippet) => (
            <Card key={snippet.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        {snippet.description || 'Code Snippet'}
                      </CardTitle>
                      {snippet.language && (
                        <Badge variant="secondary" className="text-xs">
                          {snippet.language}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      <Link
                        href={`/conversations/${snippet.conversation.id}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span className="truncate max-w-[300px]">{snippet.conversation.title}</span>
                      </Link>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                    title="Copy code"
                  >
                    {copiedId === snippet.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative rounded-lg bg-muted border overflow-hidden">
                  {/* Line numbers */}
                  <div className="flex">
                    <div className="flex-shrink-0 py-4 pl-3 pr-2 text-right border-r bg-muted/50 select-none">
                      {(snippet.code.length > 1000
                        ? snippet.code.substring(0, 1000)
                        : snippet.code
                      ).split('\n').map((_, i) => (
                        <div key={i} className="text-xs text-muted-foreground/50 leading-5">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <pre className="flex-1 p-4 overflow-x-auto text-sm">
                      <code>{snippet.code.length > 1000
                        ? snippet.code.substring(0, 1000) + '\n\n// ... truncated'
                        : snippet.code
                      }</code>
                    </pre>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                  <span>{snippet.code.split('\n').length} lines</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredSnippets.length > pageSize && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
