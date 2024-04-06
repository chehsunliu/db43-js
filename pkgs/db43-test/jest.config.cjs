/** @type {import("jest").Config} */
const config = {
  projects: [
    "<rootDir>/jest.dynamodb.config.cjs",
    // "<rootDir>/jest.mysql.config.cjs",
  ],
};

module.exports = config;
