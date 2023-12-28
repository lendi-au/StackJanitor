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
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "d.ts"],
  moduleDirectories: ["node_modules"],
  globals: {},
  collectCoverage: true,
};
