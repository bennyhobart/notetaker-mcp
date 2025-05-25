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
- 🔗 **Wiki-style linking** with `[[Note Title]]` syntax
- 🔒 **Security** with path validation and traversal protection

### Web Interface  
- 🌐 **HTTP API** exposing all MCP functionality as REST endpoints
- ⚛️ **React frontend** built with TypeScript and TailwindCSS
- ✏️ **CodeMirror 6 editor** with syntax highlighting and search
- 🔗 **Interactive note links** with bidirectional relationship tracking
- 📝 **Draft mode** with inline title editing
- 🔍 **Server-side search** with throttled UI for performance
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

GET    /api/notes/:title/links     - Get all links for a note
GET    /api/notes/:title/outgoing  - Get outgoing links
GET    /api/notes/:title/backlinks - Get backlinks (notes that link to this one)

GET    /api/health              - Health check
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
createdAt: 2024-01-15T10:30:00Z
updatedAt: 2024-01-16T14:20:00Z
priority: high
category: work
---

# My Note Title

Markdown content with [[Linked Notes]] support...
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

## Note Linking

The platform supports wiki-style note linking:

- Use `[[Note Title]]` to link to other notes
- Use `[[Note Title|Display Text]]` for custom link text
- Links are clickable in the editor and navigate to the target note
- LinksPanel shows bidirectional relationships (outgoing links and backlinks)

## Git Hooks

The project uses Husky for Git hooks:

- **pre-commit**: Runs lint-staged to check and fix issues, plus executes tests

This ensures all committed code follows the project's standards and passes tests.

## Technology Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment  
- **React 19** - Frontend framework
- **Express.js** - Web server framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **CodeMirror 6** - Advanced code editor
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality tools
- **MiniSearch** - Full-text search engine
- **Gray-Matter** - YAML frontmatter parsing
- **Lodash** - Utility functions (throttling)