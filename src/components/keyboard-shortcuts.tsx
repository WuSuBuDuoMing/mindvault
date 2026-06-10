'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl/Cmd + K: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        router.push('/search')
      }

      // Ctrl/Cmd + 1: Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault()
        router.push('/')
      }

      // Ctrl/Cmd + 2: Conversations
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault()
        router.push('/conversations')
      }

      // Ctrl/Cmd + 3: Projects
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault()
        router.push('/projects')
      }

      // Ctrl/Cmd + 4: Prompts
      if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault()
        router.push('/prompts')
      }

      // Ctrl/Cmd + 5: Code
      if ((e.ctrlKey || e.metaKey) && e.key === '5') {
        e.preventDefault()
        router.push('/code')
      }

      // Ctrl/Cmd + I: Import
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        router.push('/import')
      }

      // Ctrl/Cmd + ,: Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        router.push('/settings')
      }

      // /: Focus search (if not in input)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        router.push('/search')
      }

      // Escape: Go back (if on detail page)
      if (e.key === 'Escape') {
        const path = window.location.pathname
        if (path.includes('/conversations/') && path !== '/conversations') {
          router.push('/conversations')
        } else if (path.includes('/projects/') && path !== '/projects') {
          router.push('/projects')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}
