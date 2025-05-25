# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

Monorepo workspace with two packages:
- `packages/mcp-server/` - MCP server for note management
- `packages/web-server/` - HTTP API and React UI

## Architecture

### MCP Server (`packages/mcp-server/src/`)

- **`index.ts`**: MCP tools: list-notes, search-notes, read-note, create-note, update-note, delete-note
- **`noteService.ts`**: File operations, YAML frontmatter, auto timestamps, stores in `~/.notetaker-mcp/notes/`
- **`searchService.ts`**: Full-text search with MiniSearch, fuzzy matching, real-time index
- **`noteLinkService.ts`**: Parses `[[Note Title]]` syntax, manages link relationships

### Web Server (`packages/web-server/src/`)

- **`server.ts`**: Express server, REST API endpoints, serves React app
- **`client/`**: React 19 + TypeScript + TailwindCSS
  - CodeMirror 6 editor with syntax highlighting
  - Wiki-style `[[Note Title]]` linking with click navigation
  - LinksPanel for bidirectional relationships
  - Draft mode and inline title editing
  - Server-side search with 300ms throttling

### Data Format

```markdown
---
createdAt: 2024-01-15T10:30:00Z
updatedAt: 2024-01-16T14:20:00Z
custom: fields
---

# Note Title

Content with [[Note Links]]...
```

### Key Points

- Note titles are unique identifiers
- System manages createdAt/updatedAt timestamps
- Path.resolve() validation prevents directory traversal
- LinkTracker maintains bidirectional relationships in memory
- MCP exposes raw content including frontmatter

## Commands

```bash
# Development
npm run dev          # Full dev environment
npm run build        # Build all packages
npm start            # Production server

# Testing
npm test             # All tests
npm run test:mcp     # MCP tests only
npm run test:web     # Web tests only
npm run test:coverage # Coverage report

# Code quality
npm run lint         # Check linting
npm run lint:fix     # Fix linting
npm run format       # Format code
npm run check        # Lint + format check
npm run fix          # Fix all issues

# Package-specific
npm run dev -w packages/mcp-server
npm run dev -w packages/web-server
npm run dev:client -w packages/web-server
```

## Implementation Notes

- Tests use real filesystem operations - cleanup in teardown
- Jest requires `--experimental-vm-modules` flag for ES modules
- Vite for React build
- CodeMirror 6 with custom note link extension
- LinkTracker auto-updates on note changes
- Search throttled to 300ms
- Pre-commit hooks run tests

## API Endpoints

```
GET    /api/notes              # List all
GET    /api/notes/search?q=    # Search
GET    /api/notes/:title       # Read note
POST   /api/notes              # Create
PUT    /api/notes/:title       # Update
DELETE /api/notes/:title       # Delete

GET    /api/notes/:title/links     # All links
GET    /api/notes/:title/outgoing  # Outgoing
GET    /api/notes/:title/backlinks # Backlinks
```