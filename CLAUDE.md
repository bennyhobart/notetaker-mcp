# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo workspace** containing:
1. **MCP Server** - Model Context Protocol server for note-taking and management
2. **Web Server** - HTTP bridge and interactive tag visualization system

Both packages work together to provide a comprehensive note management platform with AI assistant integration and web-based visualization.

## Architecture

### Workspace Structure

This project uses **npm workspaces** with two packages:

- **`packages/mcp-server/`** - Core MCP server functionality
- **`packages/web-server/`** - HTTP API and web visualization
- **`public/`** - Static web assets for visualization interface

### Core Components

#### MCP Server (`packages/mcp-server/src/`)

- **`index.ts`**: MCP server implementation with tool definitions
  - Registers 6 MCP tools: `list-notes`, `search-notes`, `read-note`, `create-note`, `update-note`, `delete-note`
  - Uses Zod for input validation
  - Returns structured responses with content arrays

- **`noteService.ts`**: File system operations and note management
  - Handles YAML frontmatter parsing with `gray-matter`
  - Manages system metadata (createdAt, updatedAt) automatically
  - Sanitizes note titles to prevent path traversal attacks
  - Stores notes in `~/.notetaker-mcp/notes/` as `.md` files

- **`searchService.ts`**: Advanced search functionality with MiniSearch
  - Full-text search with fuzzy matching and relevance ranking
  - Real-time index updates when notes are modified
  - Supports prefix search and typo tolerance

- **`visualizationService.ts`**: Tag analysis and relationship mapping
  - Extracts tags from YAML frontmatter across all notes
  - Calculates tag frequencies and co-occurrence relationships
  - Provides data for interactive tag visualization

#### Web Server (`packages/web-server/src/`)

- **`server.ts`**: Express.js HTTP server
  - Exposes all MCP functionality as REST API endpoints
  - Serves interactive tag visualization interface
  - Provides CORS support and JSON error handling
  - Imports and uses MCP server functions via workspace references

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

### Workspace-Level Commands
- `npm run build` - Build all packages using TypeScript project references
- `npm test` - Run all 154 tests across both packages
- `npm run test:mcp` - Run only MCP server tests (62 tests)
- `npm run test:web` - Run only web server tests (92 tests)  
- `npm run test:coverage` - Generate coverage report for all packages

### Package-Specific Commands
- `npm run start:mcp` - Start the MCP server
- `npm run start:web` - Start the web server (with visualization at http://localhost:3000)
- `npm run dev:mcp` - Build and start MCP server in development mode
- `npm run dev:web` - Build and start web server in development mode

### Code Quality (All Packages)
- `npm run lint` - Check code style with ESLint across all packages
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier  
- `npm run check` - Run both lint and format checks
- `npm run fix` - Auto-fix both lint and format issues

### Individual Package Development
```bash
# Build specific package
npm run build -w packages/mcp-server
npm run build -w packages/web-server

# Test specific package
npm run test -w packages/mcp-server
npm run test -w packages/web-server

# Run specific test pattern
npm test -- --testNamePattern="should create a note"
```

## Important Implementation Notes

- Tests use real filesystem operations (not mocked) - ensure proper cleanup in test teardown
- Frontmatter parsing happens on both read and write operations
- Search functionality searches both title and content fields
- Path traversal protection via title sanitization removes dangerous characters
- ES modules configuration requires `--experimental-vm-modules` flag for Jest