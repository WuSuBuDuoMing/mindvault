# Contributing to MindVault

Thank you for your interest in contributing to MindVault! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Testing](#testing)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm
- Git

### Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/mindvault.git
cd mindvault

# Install dependencies
npm install

# Initialize the database
npx prisma generate
npx prisma db push

# Run tests to verify setup
npm test

# Start development server
npm run dev
```

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear, focused commits

3. Run the full verification suite before committing:
   ```bash
   npm run typecheck   # TypeScript compilation check
   npm run lint         # ESLint check
   npm test             # Run all unit tests
   npm run build        # Production build
   ```

4. Push your branch and open a Pull Request

## Code Style

### TypeScript

- Use TypeScript strict mode
- Add TSDoc comments to all exported functions, interfaces, and classes
- Prefer explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions and utility types

### TSDoc Example

```typescript
/**
 * Brief description of what the function does.
 *
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 */
export function myFunction(paramName: string): ResultType {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use shadcn/ui components from `src/components/ui/` for consistency

### CSS

- Use Tailwind CSS utility classes
- Follow the `cn()` utility for conditional class merging
- Avoid custom CSS unless absolutely necessary

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |
| `refactor:` | Code restructuring without behavior change |
| `style:` | Code formatting (no logic change) |
| `chore:` | Build process, dependencies, tooling |
| `perf:` | Performance improvements |
| `ci:` | CI/CD configuration changes |

Examples:
```
feat: add conversation comparison view
fix: handle edge case in keyword extraction for empty messages
docs: add API endpoint documentation for backup restore
test: add unit tests for markdown export functions
```

## Pull Request Process

1. **Fill in the PR template** with a clear description of what changed and why
2. **Ensure CI passes** -- the GitHub Actions workflow runs typecheck, lint, test, and build
3. **Keep PRs focused** -- one feature or fix per PR
4. **Update documentation** if adding public APIs or changing behavior
5. **Add tests** for new functionality
6. **Link related issues** using `Closes #123` in the description

A maintainer will review your PR. Please be patient and responsive to feedback.

## Reporting Bugs

Use the [Bug Report](https://github.com/WuSuBuDuoMing/mindvault/issues/new?template=bug_report.md) issue template. Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Node.js version, browser)
- Screenshots or console errors if applicable

## Requesting Features

Use the [Feature Request](https://github.com/WuSuBuDuoMing/mindvault/issues/new?template=feature_request.md) issue template. Include:

- Description of the feature
- Use case and motivation
- Proposed implementation (if you have ideas)

## Testing

MindVault uses Node.js built-in test runner. Tests are co-located with the source files:

```text
src/lib/
├── pagination.ts
├── pagination.test.ts
├── importers/claude.ts
├── importers/claude.test.ts
├── analyzers/keywords.ts
├── analyzers/keywords.test.ts
└── ...
```

### Writing Tests

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { myFunction } from './my-module.ts'

describe('myFunction', () => {
  it('should handle normal input', () => {
    const result = myFunction('input')
    assert.strictEqual(result.value, 'expected')
  })

  it('should handle edge case', () => {
    const result = myFunction('')
    assert.deepStrictEqual(result, { value: null })
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run a specific test file (via tsx)
npx tsx --test src/lib/pagination.test.ts
```

## Questions?

If you have questions about contributing, feel free to open a discussion or reach out to the maintainers.

Thank you for helping make MindVault better!
