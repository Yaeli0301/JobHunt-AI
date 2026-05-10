/**
 * Jest Configuration
 * Supports ES Modules via Babel transform.
 */

export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  moduleFileExtensions: ["js"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
};
