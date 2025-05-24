# Note Taker MCP Workspace

A streamlined note-taking platform with MCP server integration and clean web interface focused on core note management.

## Architecture

This project is organized as a **monorepo workspace** with two main packages:

- **`packages/mcp-server/`** - Model Context Protocol server for AI assistants
- **`packages/web-server/`** - HTTP bridge and React web interface

## Features

### MCP Server
- 📝 **Full CRUD operations** for markdown notes with YAML frontmatter  
- 🔍 **Advanced search** with fuzzy matching and relevance ranking
- 📋 **Metadata management** with automatic timestamps
- 🔒 **Security** with path sanitization and validation

### Web Interface  
- 🌐 **HTTP API** exposing all MCP functionality as REST endpoints
- ⚛️ **React frontend** built with TypeScript and TailwindCSS
- 📱 **Clean, responsive interface** focused on note management
- 🔄 **Hot module reloading** for development

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

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development environment:**
   ```bash
   npm run dev
   ```
   This starts the MCP server, API server, and React frontend with hot reloading.

3. **Visit the application:**
   Open http://localhost:3000 in your browser to manage your notes.

## Production Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## Development

The `npm run dev` command runs all services concurrently:
- **MCP Server** - Core note management functionality  
- **API Server** - Express.js HTTP bridge with auto-restart
- **React Frontend** - Clean note management UI with hot module reloading

For individual development:
```bash
npm run dev -w packages/mcp-server      # MCP server only
npm run dev -w packages/web-server      # API server only  
npm run dev:client -w packages/web-server # React dev server only
```

### Testing

```bash
# Run all tests (134 total)
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
priority: high
category: work
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
│   │   │   ├── index.ts          # MCP server entry point
│   │   │   ├── noteService.ts    # Core note operations
│   │   │   ├── searchService.ts  # Search functionality
│   │   │   └── __tests__/        # Test files
│   │   └── dist/            # Built output
│   └── web-server/          # HTTP bridge & React interface
│       ├── src/
│       │   ├── server.ts    # Express server
│       │   ├── client/      # React frontend
│       │   └── __tests__/   # Test files
│       └── dist/            # Built output
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
- **React 19** - Frontend framework
- **Express.js** - Web server framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality tools
- **MiniSearch** - Full-text search engine
- **Gray-Matter** - YAML frontmatter parsing