# Changelog

## v0.16.0 — Analyzer Improvements & Shared Utilities (2026-06-22)

### Changed — Code Analyzer
- Added language auto-detection for JSX, PHP, Ruby, Swift, and Kotlin
- Added language color mapping for newly detected languages (tsx, jsx, php, ruby, swift, kotlin)
- Improved regex pattern for void pointer detection in C/C++ (`void *` vs `void*`)

### Changed — Summary Analyzer
- Refactored `extractKeywords` to reuse shared `STOP_WORDS` and `TECHNICAL_TERMS` from keywords module instead of maintaining duplicate sets
- Eliminates ~30 lines of duplicated stop word lists and technical term sets across analyzers

### Changed — Keywords Analyzer
- Exported `STOP_WORDS` and `TECHNICAL_TERMS` as module-level constants for reuse by summary analyzer
- Ensures consistent keyword filtering and technical term boosting across all analyzer modules

### Testing
- Added language auto-detection tests for TypeScript, Python, Rust, Go, and PHP
- Added color mapping tests for newly supported languages
- Total test count: 95+

## v0.15.0 — CSV Export & Export Statistics (2026-06-22)

### Export — New CSV Format
- Added CSV export for prompts (`exportPromptsToCSV`) with proper field escaping
- Added CSV export for code snippets (`exportCodeSnippetsToCSV`) with line count
- Added CSV export for conversation summaries (`exportConversationsSummaryToCSV`) with message/prompt/code counts
- CSV output handles commas, quotes, and newlines with RFC 4180 compliant escaping

### Export — Statistics
- Added `ExportStatistics` interface tracking item count, byte size, format, and timestamp
- Added `buildExportStatistics` helper to compute export metadata
- `generateExportFilename` now supports `csv` extension

### Testing
- Added CSV export tests for prompts, code snippets, and conversation summaries
- Added export statistics tests including byte size calculation and Chinese character encoding
- Added CSV extension test for `generateExportFilename`

## v0.14.0 — Search Enhancements: Caching, Statistics & Highlighting (2026-06-22)

### Search — Result Caching
- Added in-memory search result cache with 5-minute TTL and LRU-like eviction (max 50 entries)
- Cache is invalidated automatically after TTL expiry; `clearSearchCache()` provided for manual reset

### Search — Statistics
- `searchAll` now returns a `SearchResponse` envelope with `results` and `statistics`
- `SearchStatistics` includes `totalResults`, `byType` breakdown, `averageRelevance`, and `durationMs`
- All pure functions (`calculateRelevance`, `fuzzyMatchScore`, `buildStatistics`, `extractHighlight`) are now exported for direct testing and reuse

### Search — Type Safety
- Added `highlight` option to `SearchOptions` for future HTML highlight support
- Regex special characters in search queries are now properly escaped in word-boundary matching (`escapeRegExp`)

### API
- `/api/search` now returns `{ results, statistics }` envelope instead of a flat array

### Security
- Fixed regex injection vulnerability: `calculateRelevance` now escapes user-supplied query before constructing `\b` word-boundary patterns

### Testing
- Added `calculateRelevance` tests (exact, starts-with, contains, combined, null handling)
- Added `extractHighlight` tests (match context, no-match fallback, ellipsis handling, edge cases)
- Added `buildStatistics` tests (empty results, type aggregation, average calculation)

## v0.13.0 — Advanced Export & Import Enhancements (2026-06-22)

### Export — Multi-Format Support
- Added JSON export for conversations, projects, prompts, and code snippets
- Added HTML (PDF-ready) export for conversations, prompts, and code snippets
- HTML exports are self-contained with inline CSS styling, suitable for browser print-to-PDF
- XSS-safe HTML output with proper character escaping
- `generateExportFilename` now supports `json` and `html` extensions plus `prompts`/`code-snippets` types

### Import Parser — Enhanced Robustness
- Added support for `content_blocks` format (newer Claude export versions)
- Added automatic message deduplication by role + content within conversations
- Added Unix timestamp (seconds) parsing alongside ISO 8601 dates
- Added progress callback support (`ImportProgressCallback`) for tracking normalization progress
- Preview now includes `roleDistribution` breakdown of user/assistant/system message counts

### Testing — Expanded Coverage
- Added `src/lib/search.test.ts` with fuzzy regex tests
- Added comprehensive JSON export tests (conversations, projects, prompts, code snippets)
- Added HTML export tests with XSS escape verification
- Added import parser tests for content_blocks, deduplication, Unix timestamps, progress callbacks
- Total test count: 75+

## v0.12.0 — Search Enhancements (2026-06-22)

### Search — Fuzzy Matching & Filtering
- Added fuzzy search mode with configurable typo tolerance via `fuzzy=true` query parameter
- Added tag-based filtering (`tags=tag1,tag2`) to scope search results by conversation tags
- Added date range filtering (`dateFrom`, `dateTo`) for time-scoped searches
- Added content type filtering (`types=conversation,prompt,code,project`)
- Added configurable result limit (`limit=N`) per search
- Tagged conversations receive a relevance boost in search ranking
- Prompt search now includes tag content matching
- Code search now includes language field matching
- Project search now includes category field matching

### Search API — New Parameters
- `GET /api/search?q=query&types=conversation,prompt&tags=work,ai&dateFrom=2024-01-01&dateTo=2024-12-31&fuzzy=true&limit=50`
- All new parameters are optional; existing `?q=query` behavior is unchanged

## v0.11.0 — Code Quality & Infrastructure (2026-06-22)

### Changed
- Improved TSDoc documentation across all library modules
- Standardized error handling patterns in API routes
- Enhanced Prisma schema with additional indexes for query performance
- Updated README with new export format documentation

## v0.7.0 — Community Governance & Funding (2026-06-16)

### Changed
- Added CODE_OF_CONDUCT.md, FUNDING.yml, CODEOWNERS, enhanced Issue/PR templates

## v0.5.0 — Security & Documentation (2026-06-14)

### Changed
- Security policy, documentation enhancements, open-source best practices

## v0.3.0 — Local Optimization & Documentation (2026-06-14)

### Changed
- Local optimization and performance improvements
- Documentation enhancement across project
- Open-source infrastructure updates

## v0.2.0 — Quality Optimization

### Documentation
- Rebranded from ClaudeNote to MindVault
- Added TSDoc comments to all core library modules (`db.ts`, `api-utils.ts`, `utils.ts`, `pagination.ts`, `tags.ts`, `backup.ts`, `search.ts`, `export/markdown.ts`, `importers/claude.ts`, `analyzers/*.ts`)
- Updated README with testing instructions and new project name
- Documented SQLite schema in `prisma/schema.prisma`

### Test Coverage
- Added 48 unit tests across 7 test files using Node.js built-in test runner
- `src/lib/importers/claude.test.ts` — Parser validation, multi-format support, role normalization
- `src/lib/analyzers/keywords.test.ts` — English/Chinese extraction, stop word filtering
- `src/lib/analyzers/code.test.ts` — Code block extraction, language detection, deduplication
- `src/lib/analyzers/projects.test.ts` — Conversation categorization
- `src/lib/analyzers/summary.test.ts` — Summary generation, type detection
- `src/lib/analyzers/prompts.test.ts` — Prompt extraction, deduplication
- `src/lib/pagination.test.ts` — Pagination parameter handling and result formatting

### Code Quality
- TypeScript typecheck passes cleanly (zero errors)
- ESLint passes cleanly (zero warnings)
- Next.js production build succeeds

### Dependencies
- Added `vitest` as dev dependency (using Node.js built-in test runner for compatibility)
- All dependencies verified working

### Build & Verification
- `npm run typecheck` — Clean
- `npm run lint` — Clean
- `npm run build` — Clean (22 routes compiled)
- `npm test` — 48/48 tests passing

## v0.1.0 — Initial Release

- Local-first knowledge base for Claude conversations
- Import Claude export JSON with drag & drop
- Auto-analysis: summaries, keywords, prompts, code snippets, project categorization
- Global search across all content types
- Markdown export for conversations, projects, prompts, code
- Dark mode with system theme support
- Backup & restore with selective import
- Keyboard shortcuts
- Tag management and batch operations
- Responsive design with collapsible sidebar
