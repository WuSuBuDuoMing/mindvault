<div align="center">

# MindVault

**Local-first knowledge base for organizing Claude conversations**

[![CI](https://github.com/WuSuBuDuoMing/mindvault/actions/workflows/ci.yml/badge.svg)](https://github.com/WuSuBuDuoMing/mindvault/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18+-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

MindVault transforms your Claude conversation history into a searchable, organized knowledge base. It automatically extracts prompts, code snippets, keywords, and categorizes conversations into projects -- all processed locally on your machine.

**[Features](#features) | [Quick Start](#quick-start) | [API Reference](#api-reference) | [Contributing](#contributing)**

</div>

---

## Why MindVault?

Claude conversations are valuable -- but they're trapped in the web UI. MindVault lets you:

- **Own your data** -- every conversation stays on your machine, in SQLite
- **Search instantly** -- full-text search across conversations, prompts, code, and projects
- **Extract value** -- automatically pull out reusable prompts, code snippets, and keywords
- **Organize automatically** -- conversations are categorized into projects using rule-based analysis
- **Export anywhere** -- Markdown export for conversations, projects, prompts, and code

## Features

| Category | Features |
|---|---|
| **Import** | Drag-and-drop JSON import, multi-format support, deduplication, import history tracking |
| **Analysis** | Auto-generated summaries, keyword extraction, prompt extraction, code block extraction, project categorization |
| **Organization** | Project groups, tag management, conversation favorites, batch operations |
| **Search** | Global search across all content types with relevance ranking and type filters |
| **Export** | Markdown export for conversations, projects, prompts, and code snippets |
| **UX** | Dark mode, keyboard shortcuts, responsive design, paginated lists, activity timeline |
| **Data Safety** | Full backup/restore, local SQLite storage, no cloud dependency |

## Privacy First

**Your data never leaves your machine.**

- All data is stored in a local SQLite database
- No external API calls for analysis (rule-based algorithms)
- No cloud sync, no accounts, no tracking
- Original Claude export files are not stored in the repository
- The SQLite database is excluded from git via `.gitignore`

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 14](https://nextjs.org/) | App Router with Server Components |
| [TypeScript 5](https://www.typescriptlang.org/) | Full type safety |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styling with typography plugin |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible UI components built on Radix UI |
| [Prisma](https://www.prisma.io/) | Type-safe database client |
| [SQLite](https://www.sqlite.org/) | Local embedded database |

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm, yarn, or pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/WuSuBuDuoMing/mindvault.git
cd mindvault

# 2. Install dependencies
npm install

# 3. Initialize the database
npx prisma generate
npx prisma db push

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Importing Your Data

1. Go to [claude.ai](https://claude.ai) > Settings > Export Data
2. Download your conversation history as `conversations.json`
3. In MindVault, navigate to the **Import** page
4. Upload the exported file via drag-and-drop
5. Review the preview and confirm the import

## Project Structure

```text
src/
├── app/                              # Next.js App Router pages
│   ├── page.tsx                      # Dashboard with activity timeline
│   ├── import/page.tsx               # Data import with drag & drop
│   ├── conversations/                # Conversations list & detail
│   ├── projects/                     # Projects list & detail
│   ├── prompts/page.tsx              # Prompt library
│   ├── code/page.tsx                 # Code snippets browser
│   ├── search/page.tsx               # Global search
│   ├── settings/page.tsx             # Settings
│   └── api/                          # REST API routes
├── components/
│   ├── layout/                       # Sidebar, header, navigation
│   ├── ui/                           # shadcn/ui primitives
│   ├── markdown-renderer.tsx         # Markdown rendering with GFM
│   ├── theme-provider.tsx            # Dark mode context provider
│   └── keyboard-shortcuts.tsx        # Global keyboard shortcuts
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── utils.ts                      # Utility functions (cn)
│   ├── api-utils.ts                  # API error handling helpers
│   ├── importers/claude.ts           # Claude JSON parser (multi-format)
│   ├── analyzers/                    # Local analysis algorithms
│   │   ├── summary.ts               # Summary generation
│   │   ├── keywords.ts              # Keyword extraction (EN + ZH)
│   │   ├── prompts.ts               # Prompt extraction & tagging
│   │   ├── code.ts                   # Code block extraction & detection
│   │   └── projects.ts              # Project categorization
│   ├── export/markdown.ts            # Markdown export
│   ├── search.ts                     # Cross-content search
│   ├── pagination.ts                 # Pagination utilities
│   ├── tags.ts                       # Tag management
│   └── backup.ts                     # Backup & restore
├── prisma/
│   └── schema.prisma                 # Database schema definition
└── scripts/
    └── generate-test-data.ts         # Test data generator
```

## Database Schema

| Model | Description |
|---|---|
| `Conversation` | Chat conversations with summaries, keywords, and favorite status |
| `Message` | Individual messages (user/assistant/system) with timestamps |
| `Project` | Auto-categorized project groups with descriptions |
| `PromptItem` | Extracted reusable prompts with topic tags |
| `CodeSnippet` | Extracted code blocks with language detection |
| `Tag` | User-assigned tags linked to conversations |
| `ConversationTag` | Many-to-many join between conversations and tags |
| `ImportBatch` | Import history tracking with status and error logs |
| `ConversationProject` | Many-to-many join between conversations and projects |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open search |
| `/` | Quick search |
| `Ctrl + 1` | Dashboard |
| `Ctrl + 2` | Conversations |
| `Ctrl + 3` | Projects |
| `Ctrl + 4` | Prompts |
| `Ctrl + 5` | Code Snippets |
| `Ctrl + I` | Import |
| `Ctrl + ,` | Settings |
| `Esc` | Go back (detail pages) |

## API Reference

MindVault exposes a REST API via Next.js API routes. All endpoints return JSON.

### Conversations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | List conversations (paginated, searchable, sortable, filterable) |
| `GET` | `/api/conversations/[id]` | Get conversation detail with messages, prompts, code |
| `GET` | `/api/conversations/[id]/export` | Export conversation as Markdown |
| `PATCH` | `/api/conversations/[id]/favorite` | Toggle conversation favorite |
| `PUT` | `/api/conversations/[id]/tags` | Update conversation tags |
| `DELETE` | `/api/conversations/batch` | Batch delete conversations |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects with conversation counts |
| `GET` | `/api/projects/[id]` | Get project detail with conversations and timeline |
| `GET` | `/api/projects/[id]/export` | Export project as Markdown |
| `POST` | `/api/projects/create` | Create new project |
| `PATCH` | `/api/projects/[id]/edit` | Update project |
| `DELETE` | `/api/projects/[id]/edit` | Delete project |

### Prompts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/prompts` | List all prompts with source conversations |
| `PATCH` | `/api/prompts/[id]` | Update prompt (favorite toggle) |
| `GET` | `/api/prompts/export` | Export all prompts as Markdown |

### Code Snippets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/code` | List all code snippets with language info |
| `GET` | `/api/code/export` | Export all code snippets as Markdown |

### Search

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/search?q=query` | Search across all content types with relevance ranking |

### Import

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/import` | Import Claude export data with deduplication and analysis |
| `GET` | `/api/import/history` | Get import history with status and error logs |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Get sidebar navigation counts |
| `GET` | `/api/backup` | Export full database backup |
| `POST` | `/api/backup` | Restore from backup |
| `DELETE` | `/api/data/clear` | Clear all data |

## Claude Export Format Support

The importer handles multiple Claude export formats:

- Array of conversations at top level
- Object with `conversations` field
- Object with `data` field
- Individual conversation objects
- Various field name conventions (`uuid`/`id`, `name`/`title`, `chat_messages`/`messages`)
- Both `sender` and `role` field names
- Various date formats (ISO 8601, timestamps, etc.)

## Development

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run all tests
npm test

# Production build
npm run build

# Database schema push
npm run db:push

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Generate test data
npm run db:seed
```

## Testing

MindVault uses Node.js built-in test runner with 48+ unit tests covering core modules:

```bash
# Run all tests
npm test

# Tests cover:
# - Import parser (multi-format validation, deduplication, preview generation)
# - Keyword extraction (English/Chinese, stop word filtering, frequency ranking)
# - Code block extraction (language detection, alias normalization, deduplication)
# - Project categorization (keyword-based classification, summary generation)
# - Summary generation (topic extraction, conversation type detection)
# - Prompt extraction (structural analysis, embedded prompts, tag assignment)
# - Pagination (parameter normalization, result formatting)
```

## Future Enhancements

- [ ] SQLite FTS5 for better full-text search performance
- [ ] AI-powered summaries (optional external API integration)
- [ ] Data visualization and analytics dashboard
- [ ] Conversation comparison view
- [ ] Export to additional formats (PDF, HTML)
- [ ] Conversation merge and split
- [ ] Multi-language UI support

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up the development environment
- Code style and conventions
- Pull request process
- Reporting bugs and requesting features

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

Built with care for the Claude community. MindVault is an independent open-source project and is not affiliated with Anthropic.
