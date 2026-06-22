import type { Metadata, Viewport } from 'next'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { ThemeProvider } from '@/components/theme-provider'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
import { LocaleProvider } from '@/i18n/locale-context'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MindVault',
    template: '%s | MindVault',
  },
  description: 'Local-first knowledge base for organizing Claude conversations. Automatically extract prompts, code snippets, and categorize conversations into projects.',
  keywords: ['Claude', 'AI', 'conversations', 'knowledge base', 'prompts', 'code snippets'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MindVault',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <ServiceWorkerRegistration />
            <KeyboardShortcuts />
            <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
              <div className="hidden border-r bg-muted/40 md:block">
                <Sidebar />
              </div>
              <div className="flex flex-col">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                  {children}
                </main>
              </div>
            </div>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
