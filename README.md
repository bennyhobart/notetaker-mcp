# Note Taker MCP Workspace

A comprehensive note-taking and visualization platform with MCP server integration and interactive web interface.

## Architecture

This project is organized as a **monorepo workspace** with two main packages:

- **`packages/mcp-server/`** - Model Context Protocol server for AI assistants
- **`packages/web-server/`** - HTTP bridge and interactive tag visualization
- **`public/`** - Web interface for note visualization

## Features

### MCP Server
- 📝 **Full CRUD operations** for markdown notes with YAML frontmatter  
- 🔍 **Advanced search** with fuzzy matching and relevance ranking
- 🏷️ **Tag system** with automatic metadata management
- 🔒 **Security** with path sanitization and validation

### Web Visualization  
- 🌐 **HTTP API** exposing all MCP functionality as REST endpoints
- 📊 **Interactive tag cloud** showing tag frequency and relationships
- 🕸️ **Network graph** displaying tag co-occurrence connections
- 🎯 **Real-time filtering** by tag combinations
- 📱 **Responsive interface** built with D3.js

## Development

### Setup

```bash
npm install
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build -w packages/mcp-server
npm run build -w packages/web-server
```

### Running

```bash
# Start MCP server
npm run start:mcp

# Start web visualization server
npm run start:web

# Development mode (rebuild + start)
npm run dev:mcp
npm run dev:web
```

### Testing

```bash
# Run all tests (154 total)
npm test

# Run tests for specific package
npm run test:mcp
npm run test:web

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Linting and Formatting

The project uses ESLint for linting and Prettier for code formatting:

- `npm run lint`: Check all packages for linting issues
- `npm run lint:fix`: Fix linting issues automatically
- `npm run format`: Format code with Prettier
- `npm run check-format`: Check if code is properly formatted
- `npm run check`: Run both lint and format checks
- `npm run fix`: Run both lint and format fixes

## API Documentation

### MCP Tools

The MCP server exposes these tools for AI assistants:

- `list-notes` - List all notes
- `search-notes` - Search notes by keywords
- `read-note` - Read a specific note
- `create-note` - Create a new note
- `update-note` - Update an existing note  
- `delete-note` - Delete a note

### HTTP API Endpoints

The web server provides REST API access:

```
GET    /api/notes              - List all notes
GET    /api/notes/search?q=    - Search notes
GET    /api/notes/:title       - Get specific note
POST   /api/notes              - Create note
PUT    /api/notes/:title       - Update note
DELETE /api/notes/:title       - Delete note

GET    /api/visualization/tags           - Get tag analysis data
POST   /api/visualization/notes-by-tags - Filter notes by tags
GET    /api/health                      - Health check
```

### Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": any,        // Present on success
  "error": {          // Present on failure
    "code": string,
    "message": string
  }
}
```

## Note Format

Notes are stored as Markdown files with YAML frontmatter:

```markdown
---
title: "My Note"
createdAt: "2024-01-15 10:30"
updatedAt: "2024-01-16 14:20"
tags: [work, project, important]
priority: high
---
# My Note Title

Markdown content goes here...
```

## Workspace Structure

```
notetaker-mcp/
├── packages/
│   ├── mcp-server/          # MCP server implementation
│   │   ├── src/
│   │   │   ├── index.ts     # MCP server entry point
│   │   │   ├── noteService.ts        # Core note operations
│   │   │   ├── searchService.ts      # Search functionality
│   │   │   ├── visualizationService.ts  # Tag analysis
│   │   │   └── __tests__/   # Test files
│   │   └── dist/            # Built output
│   └── web-server/          # HTTP bridge & visualization
│       ├── src/
│       │   ├── server.ts    # Express server
│       │   └── __tests__/   # Test files
│       └── dist/            # Built output
├── public/
│   └── index.html           # Tag visualization interface
├── jest.config.base.mjs     # Shared Jest configuration
├── tsconfig.json            # Base TypeScript config
└── tsconfig.build.json      # Build configuration
```

## Git Hooks

The project uses Husky for Git hooks:

- **pre-commit**: Runs lint-staged to check and fix issues before committing

This ensures all committed code follows the project's standards.

## Technology Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment  
- **Express.js** - Web server framework
- **D3.js** - Interactive visualizations
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality tools
- **MiniSearch** - Full-text search engine
- **Gray-Matter** - YAML frontmatter parsing