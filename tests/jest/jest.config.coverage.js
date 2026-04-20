const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const path = require("path")
const repoRoot = path.resolve(__dirname, "../..")

const customJestConfig = {
  rootDir: repoRoot,
  setupFilesAfterEnv: ["<rootDir>/tests/jest/jest.setup.js"],
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/jest/__tests__/**/*.tsx"],
  moduleDirectories: ["node_modules", "<rootDir>/tests/jest/node_modules"],
  moduleNameMapper: {
    "^zsa$": "<rootDir>/packages/zsa/src/index.ts",
    "^zsa-react$": "<rootDir>/packages/zsa-react/src/index.ts",
    "^zsa-react-query$": "<rootDir>/packages/zsa-react-query/src/index.ts",
    "^zsa-openapi$": "<rootDir>/packages/zsa-openapi/src/index.ts",
  },
  collectCoverageFrom: [
    "packages/*/src/**/*.{ts,tsx}",
    "!packages/*/src/**/*.d.ts",
  ],
}

module.exports = createJestConfig(customJestConfig)
