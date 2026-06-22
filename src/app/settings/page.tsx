'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Download, Upload, Loader2, CheckCircle, AlertCircle, Settings, Palette, Keyboard, Shield, History, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/i18n/locale-context'
import { LocaleToggle } from '@/components/locale-toggle'

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
  const { t, locale } = useTranslation()
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
        setMessage({ type: 'success', text: t('settings.backup-success') })
      } else {
        throw new Error('Backup failed')
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.backup-failed') })
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
          text: t('settings.restored', { imported: result.imported, skipped: result.skipped }),
        })
      } else {
        throw new Error('Restore failed')
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.restore-failed') })
    } finally {
      setRestoring(false)
    }
  }

  const themeOptions = [
    { value: 'light', label: t('settings.light'), description: t('settings.light-desc') },
    { value: 'dark', label: t('settings.dark'), description: t('settings.dark-desc') },
    { value: 'system', label: t('settings.system'), description: t('settings.system-desc') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
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
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>
              {t('settings.appearance-desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-3">{t('settings.theme')}</p>
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

            {/* Language */}
            <div>
              <p className="font-medium mb-3">{t('settings.language')}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {t('settings.language-desc')}
              </p>
              <LocaleToggle />
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('settings.backup-restore')}
            </CardTitle>
            <CardDescription>
              {t('settings.backup-desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button onClick={handleBackup} disabled={backing} className="w-full">
                {backing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.creating-backup')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('settings.download-backup')}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {t('settings.backup-desc-detail')}
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
              </div>
            </div>

            <div>
              <label className="block">
                <Button variant="outline" className="w-full" disabled={restoring}>
                  {restoring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('settings.restoring')}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {t('settings.restore-from-backup')}
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
                {t('settings.restore-desc')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              {t('settings.keyboard-shortcuts')}
            </CardTitle>
            <CardDescription>
              {t('settings.keyboard-desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settings.open-search')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settings.quick-search')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.dashboard')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 1</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.conversations')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 2</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.projects')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 3</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.prompts')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 4</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.code-snippets')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + 5</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.import')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + I</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.settings')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl + ,</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('settings.go-back')}</span>
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
              {t('settings.privacy')}
            </CardTitle>
            <CardDescription>
              {t('settings.privacy-desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>{t('settings.data-local')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>{t('settings.no-external')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>{t('settings.local-analysis')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>{t('settings.no-original')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settings.ai-configuration')}
            </CardTitle>
            <CardDescription>
              {t('settings.ai-config-desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.current-provider')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.local-rule')}</p>
              </div>
              <Badge variant="secondary">{t('settings.default')}</Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('settings.ai-explanation')}
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
            {t('settings.import-history')}
          </CardTitle>
          <CardDescription>
            {t('settings.import-history-desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : importHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('settings.no-imports-go')}
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
                        {t('settings.n-conversations-messages', { conversations: batch.conversationCount, messages: batch.messageCount })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(batch.createdAt).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')} {t('common.or')} {t('settings.source', { source: batch.source })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    batch.status === 'completed' ? 'default' :
                    batch.status === 'completed_with_errors' ? 'secondary' :
                    'outline'
                  }>
                    {batch.status === 'completed'
                      ? t('common.status-completed')
                      : batch.status === 'completed_with_errors'
                        ? t('common.status-completed_with_errors')
                        : batch.status === 'processing'
                          ? t('common.status-processing')
                          : t('common.status-failed')}
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
            {t('settings.danger-zone')}
          </CardTitle>
          <CardDescription>
            {t('settings.danger-desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
            <div>
              <p className="font-medium">{t('settings.clear-all-data')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.clear-desc')}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirm(t('settings.clear-confirm-1'))) {
                  if (confirm(t('settings.clear-confirm-2'))) {
                    try {
                      const response = await fetch('/api/data/clear', { method: 'DELETE' })
                      if (response.ok) {
                        setMessage({ type: 'success', text: t('settings.all-cleared') })
                        window.location.reload()
                      } else {
                        setMessage({ type: 'error', text: t('settings.clear-failed') })
                      }
                    } catch {
                      setMessage({ type: 'error', text: t('settings.clear-failed') })
                    }
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('settings.clear-all')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
