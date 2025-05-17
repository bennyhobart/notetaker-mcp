# Note Taker MCP

A Model Context Protocol server implementation for taking and managing notes.

## Development

### Setup

```bash
npm install
```

### Building

```bash
npm run build
```

### Linting and Formatting

The project uses ESLint for linting and Prettier for code formatting. The following commands are available:

- `npm run lint`: Run ESLint to check for issues
- `npm run lint:fix`: Run ESLint and fix issues automatically
- `npm run format`: Run Prettier to format code
- `npm run check-format`: Check if code is properly formatted
- `npm run check`: Run both lint and format checks
- `npm run fix`: Run both lint and format fixes

### Git Hooks

The project uses Husky to set up Git hooks:

- **pre-commit**: Runs lint-staged to check and fix linting/formatting issues before committing

This ensures that all code committed to the repository follows the project's coding standards.
