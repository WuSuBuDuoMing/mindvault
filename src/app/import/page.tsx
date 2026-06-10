'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, X, ArrowRight, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { validateClaudeExport, generateImportPreview } from '@/lib/importers/claude'

interface PreviewData {
  conversationCount: number
  totalMessages: number
  dateRange: { start: Date; end: Date } | null
  sampleTitles: string[]
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jsonData, setJsonData] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setImported(false)
    setError(null)
    setPreview(null)
    setJsonData(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        const validation = validateClaudeExport(data)

        if (!validation.valid) {
          setError(validation.error || 'Invalid file format')
          return
        }

        const previewData = generateImportPreview(data)
        setPreview(previewData)
        setJsonData(data)
      } catch (err) {
        setError('Failed to parse JSON file. Please ensure it\'s a valid JSON.')
      }
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(selectedFile)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }, [processFile])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.json')) {
        setError('Please upload a JSON file')
        return
      }
      processFile(droppedFile)
    }
  }, [processFile])

  const handleImport = async () => {
    if (!jsonData) return

    setImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }

      const result = await response.json()

      if (result.errors && result.errors.length > 0) {
        setError(`Imported with ${result.errors.length} error(s): ${result.errors.slice(0, 3).join(', ')}`)
      }

      setImportResult({
        imported: result.imported || 0,
        skipped: result.skipped || 0,
        errors: result.errors || [],
      })
      setImported(true)

      setTimeout(() => {
        router.push('/conversations')
        router.refresh()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setJsonData(null)
    setError(null)
    setImported(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const currentStep = imported ? 3 : preview ? 2 : file ? 1 : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import</h2>
        <p className="text-muted-foreground">
          Import your Claude conversation history
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Select File', 'Preview', 'Import', 'Done'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
              i <= currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
              {step}
            </span>
            {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Upload your exported Claude conversations.json file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File upload area with drag & drop */}
          {!file && (
            <div
              className={`flex items-center justify-center w-full transition-colors ${
                dragActive ? 'bg-primary/5' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <label
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-10 h-10 mb-3 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    conversations.json from Claude export
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports multiple export formats
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {/* File info */}
          {file && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border">
              <FileJson className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="flex-shrink-0">
                <X className="h-4 w-4 mr-1" />
                Change
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Import Error</p>
                <p className="text-xs mt-1 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !imported && (
            <div className="p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-lg">Preview</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">{preview.conversationCount.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{preview.totalMessages.toLocaleString()}</p>
                </div>
                {preview.dateRange && (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="text-sm font-medium">
                        {preview.dateRange.start.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="text-sm font-medium">
                        {preview.dateRange.end.toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {preview.sampleTitles.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Sample Titles</p>
                  <ul className="text-sm space-y-1.5">
                    {preview.sampleTitles.map((title, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span className="text-muted-foreground">{title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          {preview && !imported && (
            <div className="space-y-2">
              <Button onClick={handleImport} disabled={importing} className="w-full" size="lg">
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing {preview.conversationCount} conversations...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {preview.conversationCount.toLocaleString()} Conversations
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Duplicate conversations will be automatically skipped
              </p>
            </div>
          )}

          {/* Success message */}
          {imported && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    Import completed!
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    Redirecting to conversations...
                  </p>
                </div>
              </div>
              {importResult && (
                <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Export from Claude</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">1.</span>
              <span>Go to <a href="https://claude.ai/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">claude.ai/settings</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">2.</span>
              <span>Click on &quot;Export Data&quot; in the account section</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">3.</span>
              <span>Download the exported ZIP file</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">4.</span>
              <span>Extract and upload the conversations.json file here</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
