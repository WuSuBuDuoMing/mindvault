import type { Locale } from './types'

// zh-CN translations
import zhCNCommon from './locales/zh-CN/common.json'
import zhCNDashboard from './locales/zh-CN/dashboard.json'
import zhCNSidebar from './locales/zh-CN/sidebar.json'
import zhCNHeader from './locales/zh-CN/header.json'
import zhCNImport from './locales/zh-CN/import.json'
import zhCNConversations from './locales/zh-CN/conversations.json'
import zhCNConversationDetail from './locales/zh-CN/conversation-detail.json'
import zhCNProjects from './locales/zh-CN/projects.json'
import zhCNProjectDetail from './locales/zh-CN/project-detail.json'
import zhCNPrompts from './locales/zh-CN/prompts.json'
import zhCNCode from './locales/zh-CN/code.json'
import zhCNSearch from './locales/zh-CN/search.json'
import zhCNSettings from './locales/zh-CN/settings.json'
import zhCNNotFound from './locales/zh-CN/not-found.json'
import zhCNError from './locales/zh-CN/error.json'

// en translations
import enCommon from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enSidebar from './locales/en/sidebar.json'
import enHeader from './locales/en/header.json'
import enImport from './locales/en/import.json'
import enConversations from './locales/en/conversations.json'
import enConversationDetail from './locales/en/conversation-detail.json'
import enProjects from './locales/en/projects.json'
import enProjectDetail from './locales/en/project-detail.json'
import enPrompts from './locales/en/prompts.json'
import enCode from './locales/en/code.json'
import enSearch from './locales/en/search.json'
import enSettings from './locales/en/settings.json'
import enNotFound from './locales/en/not-found.json'
import enError from './locales/en/error.json'

export const defaultLocale: Locale = 'zh-CN'

const translations: Record<Locale, Record<string, Record<string, string>>> = {
  'zh-CN': {
    common: zhCNCommon,
    dashboard: zhCNDashboard,
    sidebar: zhCNSidebar,
    header: zhCNHeader,
    import: zhCNImport,
    conversations: zhCNConversations,
    'conversation-detail': zhCNConversationDetail,
    projects: zhCNProjects,
    'project-detail': zhCNProjectDetail,
    prompts: zhCNPrompts,
    code: zhCNCode,
    search: zhCNSearch,
    settings: zhCNSettings,
    'not-found': zhCNNotFound,
    error: zhCNError,
  },
  en: {
    common: enCommon,
    dashboard: enDashboard,
    sidebar: enSidebar,
    header: enHeader,
    import: enImport,
    conversations: enConversations,
    'conversation-detail': enConversationDetail,
    projects: enProjects,
    'project-detail': enProjectDetail,
    prompts: enPrompts,
    code: enCode,
    search: enSearch,
    settings: enSettings,
    'not-found': enNotFound,
    error: enError,
  },
}

function flatMap(namespaceMap: Record<string, Record<string, string>>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [ns, keys] of Object.entries(namespaceMap)) {
    for (const [key, value] of Object.entries(keys)) {
      result[`${ns}.${key}`] = value
    }
  }
  return result
}

const flatMaps: Record<Locale, Record<string, string>> = {
  'zh-CN': flatMap(translations['zh-CN']),
  en: flatMap(translations.en),
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const value = flatMaps[locale][key]
  if (!value) return key
  if (!params) return value
  return value.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`
  )
}

export const categoryLabels: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    code: '代码',
    course: '课程',
    prompt: '提示词',
    creative: '创意',
    research: '研究',
    business: '商业',
    data: '数据',
    design: '设计',
    other: '其他',
  },
  en: {
    code: 'Code',
    course: 'Course',
    prompt: 'Prompt',
    creative: 'Creative',
    research: 'Research',
    business: 'Business',
    data: 'Data',
    design: 'Design',
    other: 'Other',
  },
}

export function translateCategory(locale: Locale, category: string): string {
  return categoryLabels[locale][category] || category
}
