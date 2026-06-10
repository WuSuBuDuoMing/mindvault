import type { Metadata } from 'next'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ClaudeNote',
    template: '%s | ClaudeNote',
  },
  description: 'Local-first knowledge base for organizing Claude conversations. Automatically extract prompts, code snippets, and categorize conversations into projects.',
  keywords: ['Claude', 'AI', 'conversations', 'knowledge base', 'prompts', 'code snippets'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
        </ThemeProvider>
      </body>
    </html>
  )
}
