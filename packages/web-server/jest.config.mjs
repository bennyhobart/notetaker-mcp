import baseConfig from "../../jest.config.base.mjs";

/** @type {import('jest').Config} */
export default {
  ...baseConfig,
  displayName: "web-server",
  rootDir: ".",
  roots: ["<rootDir>/src", "<rootDir>/../mcp-server/src"],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    "^@notetaker/mcp-server/noteService$": "<rootDir>/../mcp-server/src/noteService.ts",
    "^@notetaker/mcp-server/visualizationService$":
      "<rootDir>/../mcp-server/src/visualizationService.ts",
    "^@notetaker/mcp-server/searchService$": "<rootDir>/../mcp-server/src/searchService.ts",
  },
};
