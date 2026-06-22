'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderOpen, Search, Loader2, MessageSquare, Plus } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation, useLocale } from '@/i18n/locale-context'
import { translateCategory } from '@/i18n'

interface Project {
  id: string
  name: string
  summary: string | null
  category: string
  createdAt: string
  updatedAt: string
  _count: {
    conversations: number
  }
}

export default function ProjectsPage() {
  const { t, locale } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', category: 'other', summary: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })
      if (response.ok) {
        setShowCreateDialog(false)
        setNewProject({ name: '', category: 'other', summary: '' })
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.summary?.toLowerCase().includes(query) ||
      project.category.toLowerCase().includes(query)
    )
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      code: 'bg-blue-100 text-blue-800',
      course: 'bg-purple-100 text-purple-800',
      prompt: 'bg-yellow-100 text-yellow-800',
      creative: 'bg-pink-100 text-pink-800',
      research: 'bg-green-100 text-green-800',
      business: 'bg-orange-100 text-orange-800',
      data: 'bg-cyan-100 text-cyan-800',
      design: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.other
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('projects.title')}</h2>
          <p className="text-muted-foreground">
            {t('projects.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('projects.create-project')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('projects.search-placeholder')}
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? t('projects.no-matching') : t('projects.no-projects')}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? t('projects.try-adjusting')
                : t('projects.auto-created')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </CardTitle>
                    <Badge className={`${getCategoryColor(project.category)} flex-shrink-0`}>
                      {translateCategory(locale, project.category)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs">
                    {project.summary || t('projects.no-summary')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{t('projects.n-conversations', { count: project._count.conversations })}</span>
                    </div>
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('projects.create-new-project')}</DialogTitle>
            <DialogDescription>
              {t('projects.create-project-desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('projects.name')}</label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder={t('projects.project-name-placeholder')}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('projects.category')}</label>
              <select
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                title="Project category"
              >
                <option value="code">{t('projects.code')}</option>
                <option value="course">{t('projects.course')}</option>
                <option value="prompt">{t('projects.prompt')}</option>
                <option value="creative">{t('projects.creative')}</option>
                <option value="research">{t('projects.research')}</option>
                <option value="business">{t('projects.business')}</option>
                <option value="data">{t('projects.data')}</option>
                <option value="design">{t('projects.design')}</option>
                <option value="other">{t('projects.other')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('projects.summary-optional')}</label>
              <Input
                value={newProject.summary}
                onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
                placeholder={t('projects.brief-desc')}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || creating}>
              {creating ? t('projects.creating') : t('projects.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
