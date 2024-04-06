/** @type {import("jest").Config} */
const config = {
  displayName: "db43-test / mysql",
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup-mysql.ts"],
};

module.exports = config;
