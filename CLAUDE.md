# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Model Context Protocol (MCP) server** for note-taking and management. It exposes tools that allow AI assistants to create, read, update, delete, and search notes stored as Markdown files with YAML frontmatter.

## Architecture

### Core Components

- **`src/index.ts`**: MCP server implementation with tool definitions
  - Registers 6 MCP tools: `list-notes`, `search-notes`, `read-note`, `create-note`, `update-note`, `delete-note`
  - Uses Zod for input validation
  - Returns structured responses with content arrays

- **`src/noteService.ts`**: File system operations and note management
  - Handles YAML frontmatter parsing with `gray-matter`
  - Manages system metadata (createdAt, updatedAt) automatically
  - Sanitizes note titles to prevent path traversal attacks
  - Stores notes in `~/.notetaker-mcp/notes/` as `.md` files

### Data Model

Notes have a simple interface:
```typescript
interface Note {
  title: string;
  content: string; // Raw file content including YAML frontmatter
}
```

Files are stored with this format:
```markdown
---
createdAt: 2024-01-15T10:30:00Z
updatedAt: 2024-01-16T14:20:00Z
priority: high
tags: [work, urgent]
---
# Note Title
Markdown content here...
```

### Key Design Decisions

- **Raw content exposure**: MCP interface exposes complete file content including frontmatter
- **System metadata management**: `createdAt`/`updatedAt` automatically managed on write operations
- **Reserved field protection**: Users cannot override system fields (`title`, `content`, `createdAt`, `updatedAt`)
- **Title-based identification**: Note titles serve as unique identifiers (sanitized for filesystem safety)
- **User directory storage**: Notes stored in OS-appropriate user directory for portability

## Development Commands

### Core Development
- `npm run build` - Compile TypeScript and make executable
- `npm test` - Run all tests (uses ES modules with experimental VM modules)
- `npm test:watch` - Run tests in watch mode
- `npm test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run check` - Run both lint and format checks
- `npm run fix` - Auto-fix both lint and format issues

### Testing Individual Files
```bash
# Run single test file
npm test -- noteService.test.ts

# Run specific test pattern
npm test -- --testNamePattern="should create a note"
```

## Important Implementation Notes

- Tests use real filesystem operations (not mocked) - ensure proper cleanup in test teardown
- Frontmatter parsing happens on both read and write operations
- Search functionality searches both title and content fields
- Path traversal protection via title sanitization removes dangerous characters
- ES modules configuration requires `--experimental-vm-modules` flag for Jest