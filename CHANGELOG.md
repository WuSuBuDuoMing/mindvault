# Changelog

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
