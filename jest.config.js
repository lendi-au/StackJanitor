module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
  testRegex: "(src/optional-handlers/searchDeleteCloudformationStack.test.ts)",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "d.ts"],
  moduleDirectories: ["node_modules"],
  globals: {},
  collectCoverage: true,
};
