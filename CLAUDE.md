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

## Common Tasks

### Adding New Features

1. **Always check existing patterns first** - Look at similar features before implementing
2. **Update both MCP and Web layers** - Features often need changes in both packages
3. **Add tests** - Follow existing test patterns in `__tests__` directories
4. **Update search index** - Call appropriate methods when notes change

### Working with Notes

```typescript
// Creating a note - always provide title and content
createNote(title: string, content: string)

// Note titles are filesystem paths - they get sanitized automatically
// User provides: "My Note/With Slashes"
// Stored as: "My Note_With Slashes.md"

// When notes don't exist, UI creates drafts automatically
if (404) { createDraftNote(requestedTitle) }
```

### Testing Requirements

- **Server tests**: Mock fetch, use supertest for API testing
- **React tests**: Use @testing-library/react, mock fetch globally
- **Always run**: `npm test` before committing
- **React components**: Need `@jest-environment jsdom` comment
- **Async updates**: Use `waitFor` or `findBy*` queries to avoid act() warnings

### Note Linking System

```typescript
// Links are bidirectional and auto-update
[[Note Title]] -> Creates link to "Note Title"
[[Note Title|Custom Text]] -> Shows "Custom Text" but links to "Note Title"

// LinkTracker maintains relationships:
- getOutgoingLinks(noteTitle) -> notes this note links to
- getBacklinks(noteTitle) -> notes that link to this note
```

## Important Patterns

### State Management

- **Draft notes**: Have `isDraft: true` property, no filesystem presence
- **Loading states**: Always show loading UI during async operations
- **Search throttling**: 300ms delay prevents excessive API calls
- **Content sync**: Compare against original content, not editor state

### Error Handling

- **404 on note links**: Create draft with requested title
- **Path traversal**: Use path.resolve() validation
- **Search failures**: Return empty array, don't crash
- **Network errors**: Show user-friendly messages

### Performance Considerations

- **Search index**: Updates automatically on note CRUD operations
- **Throttled search**: Prevents UI lag during typing
- **Bulk operations**: Use Promise.all() for parallel fetches
- **Large notes**: No special handling needed currently

## Data Flow

1. **User types in editor** → CodeMirror state update
2. **User saves** → API call → noteService → filesystem
3. **Filesystem change** → searchService index update
4. **Search query** → throttled → API → searchService → results
5. **Note link click** → loadNoteContent → create draft if 404

## Common Issues & Solutions

### "Note not found" on link click

**Solution**: Already handled - creates draft automatically

### Search not updating

**Check**: Is searchService being notified of changes?

```typescript
// After any note operation:
await addNoteToSearch(title, content);
await updateNoteInSearch(title, content);
await removeNoteFromSearch(title);
```

### React test warnings

**Solution**: Use async patterns

```typescript
// Bad
it('test', () => {
  render(<Component />)
  // state updates happen
})

// Good
it('test', async () => {
  render(<Component />)
  await waitFor(() => {
    expect(element).toBeInTheDocument()
  })
})
```

## Commands

```bash
# Development
npm run dev          # Full dev environment (recommended)
npm run build        # Build all packages
npm start            # Production server

# Testing
npm test             # All tests (run before committing)
npm run test:mcp     # MCP tests only
npm run test:web     # Web tests only

# Code quality
npm run lint         # Check linting
npm run fix          # Fix lint & format issues
```

## Code Style Guidelines

1. **TypeScript**: Use explicit types for function parameters
2. **React**: Functional components with TypeScript
3. **Async**: Always handle errors properly
4. **File paths**: Use absolute paths in tools, not relative
5. **Tests**: Descriptive test names, group related tests

## When Making Changes

### Before coding:

- Read existing similar code
- Check if tests exist for similar features
- Understand the data flow

### While coding:

- Follow existing patterns
- Add types for new interfaces
- Update tests as you go

### After coding:

- Run `npm test`
- Run `npm run lint`
- Test the feature in the UI at http://localhost:3001
- Check that note links work correctly

## API Endpoints

```
# Notes CRUD
GET    /api/notes              # List all
GET    /api/notes/:title       # Get specific
POST   /api/notes              # Create (title, content)
PUT    /api/notes/:title       # Update (content only)
DELETE /api/notes/:title       # Delete

# Search & Links
GET    /api/notes/search?q=    # Full-text search
GET    /api/notes/:title/links     # All links
GET    /api/notes/:title/outgoing  # Outgoing links
GET    /api/notes/:title/backlinks # Backlinks
```

## Quick Debugging

```bash
# Check if MCP server is working
curl http://localhost:3001/api/health

# List all notes
curl http://localhost:3001/api/notes

# Search notes
curl http://localhost:3001/api/notes/search?q=test

# View note directory
ls -la ~/.notetaker-mcp/notes/
```
