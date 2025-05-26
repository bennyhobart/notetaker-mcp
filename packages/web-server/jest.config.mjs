import baseConfig from "../../jest.config.base.mjs";

/** @type {import('jest').Config} */
export default {
  ...baseConfig,
  displayName: "web-server",
  rootDir: ".",
  roots: ["<rootDir>/src", "<rootDir>/../mcp-server/src"],
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2022',
        target: 'ES2022',
        moduleResolution: 'Node',
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react|react-dom)/)'
  ],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    "^@notetaker/mcp-server/noteService$": "<rootDir>/../mcp-server/src/noteService.ts",
    "^@notetaker/mcp-server/visualizationService$":
      "<rootDir>/../mcp-server/src/visualizationService.ts",
    "^@notetaker/mcp-server/searchService$": "<rootDir>/../mcp-server/src/searchService.ts",
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/mocks/styleMock.js'
  },
  setupFilesAfterEnv: [],
};
