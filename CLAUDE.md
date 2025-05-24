# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo workspace** containing:
1. **MCP Server** - Model Context Protocol server for note-taking and management
2. **Web Server** - HTTP bridge and clean React interface

Both packages work together to provide a streamlined note management platform with AI assistant integration and web-based interface.

## Architecture

### Workspace Structure

This project uses **npm workspaces** with two packages:

- **`packages/mcp-server/`** - Core MCP server functionality
- **`packages/web-server/`** - HTTP API and React web interface

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


#### Web Server (`packages/web-server/src/`)

- **`server.ts`**: Express.js HTTP server with React SPA support
  - Exposes all MCP functionality as REST API endpoints
  - Serves built React application for note management
  - Provides environment-based configuration and robust static file serving
  - Imports and uses MCP server functions via workspace references

- **`client/`**: React frontend application
  - Built with React 19, TypeScript, and TailwindCSS
  - Clean note management interface (NotesList, NotesView)
  - Uses Vite for development and production builds

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
category: work
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

### Primary Workflow Commands
- `npm run dev` - Start full development environment (MCP server + API + React UI with hot reloading)
- `npm run build` - Build all packages for production
- `npm start` - Start production server (serves built React app + API)

### Testing Commands
- `npm test` - Run all tests across both packages
- `npm run test:mcp` - Run only MCP server tests
- `npm run test:web` - Run only web server tests  
- `npm run test:coverage` - Generate coverage report for all packages

### Code Quality Commands
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

# Development mode for specific package
npm run dev -w packages/mcp-server      # MCP server only
npm run dev -w packages/web-server      # API server only  
npm run dev:client -w packages/web-server # React dev server only

# Run specific test pattern
npm test -- --testNamePattern="should create a note"
```

## Important Implementation Notes

- **File Operations**: Tests use real filesystem operations (not mocked) - ensure proper cleanup in test teardown
- **Frontmatter Processing**: Parsing happens on both read and write operations
- **Search Functionality**: Searches both title and content fields with MiniSearch
- **Security**: Path traversal protection via title sanitization removes dangerous characters
- **Module System**: ES modules configuration requires `--experimental-vm-modules` flag for Jest
- **Frontend Build**: React app built with Vite for fast development and production builds
- **Environment Configuration**: Simple validation without external libraries, supports both development and production modes
- **Static File Serving**: Robust path resolution that works in different deployment scenarios

## Development Best Practices

- Never commit code with the claude attribution