/** @type {import('jest').Config} */
export default {
  projects: [
    '<rootDir>/packages/mcp-server',
    '<rootDir>/packages/web-server'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true
};