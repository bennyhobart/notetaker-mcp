module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./packages/*/tsconfig.json"],
  },
  ignorePatterns: [
    "dist/**",
    "build/**", 
    "node_modules/**",
    "packages/*/dist/**",
    "packages/*/build/**",
    "packages/*/node_modules/**",
    "*.js",
    "*.mjs",
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "no-console": ["warn", { allow: ["error", "warn"] }],
  },
};
