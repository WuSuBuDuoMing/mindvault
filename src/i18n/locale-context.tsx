'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { Locale, I18nContextValue } from './types'
import { translate, defaultLocale } from './index'

const LocaleContext = createContext<I18nContextValue | null>(null)

const LOCALE_KEY = 'mindvault-locale'

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'en' || stored === 'zh-CN') return stored
  return defaultLocale
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_KEY, newLocale)
    document.documentElement.lang = newLocale === 'zh-CN' ? 'zh-CN' : 'en'
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params)
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): I18nContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useTranslation() {
  const { t, locale } = useLocale()
  return { t, locale }
}
