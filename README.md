# ClaudeNote

Local-first knowledge base for organizing Claude conversations.

ClaudeNote transforms your Claude conversation history into a searchable, organized knowledge base. It automatically extracts prompts, code snippets, keywords, and categorizes conversations into projects — all processed locally on your machine.

## Features

- **Import** — Upload Claude export JSON files with drag & drop
- **Auto-analysis** — Summaries, keywords, and categorization generated locally
- **Keyword Extraction** — Automatic keyword extraction from conversations
- **Prompt Library** — Automatically extracted reusable prompts from conversations
- **Code Snippets** — Code blocks extracted with language detection and line numbers
- **Project Organization** — Conversations auto-categorized into projects with manual create/edit
- **Global Search** — Search across conversations, prompts, code, projects, and keywords with type filters
- **Markdown Export** — Export conversations, projects, prompts, and code snippets to Markdown
- **Dark Mode** — Light, dark, and system theme support
- **Backup & Restore** — Full database backup and restore with selective import
- **Keyboard Shortcuts** — Quick navigation with keyboard
- **Import History** — Track import batches with status and error logs
- **Conversation Favorites** — Star/favorite important conversations
- **Tag Management** — Add and remove tags on conversations
- **Batch Operations** — Multi-select and batch delete conversations
- **Pagination** — Paginated lists for conversations, prompts, and code snippets
- **Activity Timeline** — Dashboard with recent activity and keyword cloud
- **Responsive Design** — Mobile-friendly with collapsible sidebar
- **Error Handling** — Custom 404, error, and loading pages

## Privacy First

**Your data never leaves your machine.**

- All data is stored in a local SQLite database
- No external API calls for analysis (rule-based algorithms)
- No cloud sync, no accounts, no tracking
- Original Claude export files are not stored in the repository
- The SQLite database is excluded from git via `.gitignore`
- No data is sent to the `public` directory

## Tech Stack

- **Next.js 14** — App Router with Server Components
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling with typography plugin
- **shadcn/ui** — Accessible UI components
- **Prisma** — Type-safe database client
- **SQLite** — Local database

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd claudenote

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Setup database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Import

1. Go to [claude.ai](https://claude.ai) → Settings → Export Data
2. Download your conversation history
3. In ClaudeNote, go to **Import** page
4. Upload the exported `conversations.json` file
5. Review the preview and confirm import

## Project Structure

```text
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Dashboard
│   ├── import/page.tsx           # Data import
│   ├── conversations/            # Conversations list & detail
│   ├── projects/                 # Projects list & detail
│   ├── prompts/page.tsx          # Prompt library
│   ├── code/page.tsx             # Code snippets
│   ├── search/page.tsx           # Global search
│   ├── settings/page.tsx         # Settings
│   └── api/                      # API routes
├── components/
│   ├── layout/                   # Layout components
│   ├── ui/                       # shadcn/ui components
│   ├── markdown-renderer.tsx     # Markdown rendering
│   ├── theme-provider.tsx        # Dark mode provider
│   ├── theme-toggle.tsx          # Theme toggle button
│   └── keyboard-shortcuts.tsx    # Global shortcuts
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── utils.ts                  # Utility functions
│   ├── importers/claude.ts       # Claude JSON parser (multi-format)
│   ├── analyzers/                # Local analysis algorithms
│   │   ├── summary.ts            # Summary generation
│   │   ├── keywords.ts           # Keyword extraction
│   │   ├── prompts.ts            # Prompt extraction
│   │   ├── code.ts               # Code block extraction
│   │   └── projects.ts           # Project categorization
│   ├── export/markdown.ts        # Markdown export
│   ├── search.ts                 # Search functionality
│   ├── pagination.ts             # Pagination utilities
│   ├── tags.ts                   # Tag management
│   └── backup.ts                 # Backup & restore
├── prisma/
│   └── schema.prisma             # Database schema
└── scripts/
    └── generate-test-data.ts     # Test data generator
```

## Database Schema

- **Conversation** — Chat conversations with summaries and keywords
- **Message** — Individual messages (user/assistant/system)
- **Project** — Auto-categorized project groups
- **PromptItem** — Extracted reusable prompts
- **CodeSnippet** — Extracted code blocks with language detection
- **Tag** — User-assigned tags
- **ImportBatch** — Import history tracking

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
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

### Conversations

- `GET /api/conversations` — List conversations (paginated, searchable, sortable, filterable)
- `GET /api/conversations/[id]` — Get conversation detail with messages, prompts, code
- `GET /api/conversations/[id]/export` — Export as Markdown
- `PATCH /api/conversations/[id]/favorite` — Toggle conversation favorite
- `PUT /api/conversations/[id]/tags` — Manage conversation tags
- `DELETE /api/conversations/batch` — Batch delete conversations

### Projects

- `GET /api/projects` — List all projects with conversation counts
- `GET /api/projects/[id]` — Get project detail with conversations and timeline
- `GET /api/projects/[id]/export` — Export project as Markdown
- `POST /api/projects/create` — Create new project
- `PATCH /api/projects/[id]/edit` — Update project
- `DELETE /api/projects/[id]/edit` — Delete project

### Prompts

- `GET /api/prompts` — List all prompts with source conversations
- `PATCH /api/prompts/[id]` — Update prompt (favorite toggle)
- `GET /api/prompts/export` — Export all prompts as Markdown

### Code

- `GET /api/code` — List all code snippets with language info
- `GET /api/code/export` — Export all code snippets as Markdown

### Search

- `GET /api/search?q=query` — Search across all content types

### Import

- `POST /api/import` — Import Claude export data with dedup and analysis
- `GET /api/import/history` — Get import history

### Stats

- `GET /api/stats` — Get sidebar navigation counts

### Backup

- `GET /api/backup` — Export full database backup
- `POST /api/backup` — Restore from backup

### Data Management

- `DELETE /api/data/clear` — Clear all data

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Database management
npm run db:push    # Push schema changes
npm run db:studio  # Open Prisma Studio

# Generate test data
npm run db:seed
```

## Test Data

Generate test data for development:

```bash
npm run db:seed
```

This creates `data/test-export.json` with sample conversations covering:

- Software development (Next.js, React Native)
- Data analysis (Python/Pandas)
- Prompt engineering
- Life planning
- Design
- Database design
- Research papers

Then import the generated file through the Import page.

## Claude Export Format Support

The importer supports multiple Claude export formats:

- Array of conversations at top level
- Object with `conversations` field
- Object with `data` field
- Individual conversation objects
- Various field name conventions (`uuid`/`id`, `name`/`title`, `chat_messages`/`messages`, etc.)
- Both `sender` and `role` field names
- Various date formats

## Future Enhancements

- [ ] SQLite FTS5 for better full-text search
- [ ] AI-powered summaries (optional external API)
- [ ] Batch operations (select multiple items)
- [ ] Data visualization and analytics
- [ ] Tag management UI
- [ ] Conversation comparison
- [ ] Export to more formats (PDF, HTML)
- [ ] Conversation merge and split

## License

MIT

---

Built with ❤️ for the Claude community
