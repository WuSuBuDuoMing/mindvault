'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Download, Upload, Loader2, CheckCircle, AlertCircle, Settings, Palette, Keyboard, Shield, History, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ImportBatch {
  id: string
  source: string
  fileName: string | null
  conversationCount: number
  messageCount: number
  status: string
  createdAt: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [backing, setBacking] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importHistory, setImportHistory] = useState<ImportBatch[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetchImportHistory()
  }, [])

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('/api/import/history')
      if (response.ok) {
        const data = await response.json()
        setImportHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleBackup = async () => {
    setBacking(true)
    setMessage(null)

    try {
      const response = await fetch('/api/backup')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `claudenote-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Backup downloaded successfully!' })
      } else {
        throw new Error('Backup failed')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' })
    } finally {
      setBacking(false)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRestoring(true)
    setMessage(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({
          type: 'success',
          text: `Restored: ${result.imported} conversations imported, ${result.skipped} skipped`,
        })
      } else {
        throw new Error('Restore failed')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to restore backup. Please check the file format.' })
    } finally {
      setRestoring(false)
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Light theme for daytime use' },
    { value: 'dark', label: 'Dark', description: 'Dark theme for low-light environments' },
    { value: 'system', label: 'System', description: 'Follow your system preference' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your ClaudeNote settings and data
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                      theme === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup & Restore
            </CardTitle>
            <CardDescription>
              Export or import your entire ClaudeNote database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button onClick={handleBackup} disabled={backing} className="w-full">
                {backing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating backup...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Downloads all conversations, prompts, code snippets, and projects as JSON
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div>
              <label className="block">
                <Button variant="outline" className="w-full" disabled={restoring}>
                  {restoring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Restore from Backup
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleRestore}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Import a previously exported backup file
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription>
              Quick actions with keyboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open search</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quick search</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dashboard</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 1</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversations</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 2</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projects</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 3</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prompts</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 4</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code Snippets</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 5</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Import</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + I</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settings</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + ,</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Go back (detail pages)</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>
              Data handling and privacy information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>All data is stored locally in SQLite on your machine</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>No data is sent to external servers or APIs</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>Analysis is performed locally using rule-based algorithms</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>Original Claude export files are not stored in the repository</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Configure AI provider for enhanced features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Provider</p>
                <p className="text-sm text-muted-foreground">Local (Rule-based)</p>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ClaudeNote currently uses local rule-based analysis for summaries, keyword extraction,
                prompt identification, and project categorization. AI-powered features (better summaries,
                smart categorization) will be available in a future update. No external API calls are made.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
          <CardDescription>
            Record of all data imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : importHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No imports yet. Go to the Import page to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {importHistory.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      batch.status === 'completed' ? 'bg-green-500' :
                      batch.status === 'completed_with_errors' ? 'bg-yellow-500' :
                      batch.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">
                        {batch.conversationCount} conversations, {batch.messageCount} messages
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(batch.createdAt).toLocaleString()} • Source: {batch.source}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    batch.status === 'completed' ? 'default' :
                    batch.status === 'completed_with_errors' ? 'secondary' :
                    'outline'
                  }>
                    {batch.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions. Please be careful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
            <div>
              <p className="font-medium">Clear All Data</p>
              <p className="text-sm text-muted-foreground">
                Delete all conversations, prompts, code snippets, and projects. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
                  if (confirm('This will permanently delete all conversations, prompts, code snippets, and projects. Continue?')) {
                    try {
                      const response = await fetch('/api/data/clear', { method: 'DELETE' })
                      if (response.ok) {
                        setMessage({ type: 'success', text: 'All data has been cleared.' })
                        window.location.reload()
                      } else {
                        setMessage({ type: 'error', text: 'Failed to clear data.' })
                      }
                    } catch {
                      setMessage({ type: 'error', text: 'Failed to clear data.' })
                    }
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
