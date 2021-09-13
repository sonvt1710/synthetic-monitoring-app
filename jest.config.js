// This file is needed because it is used by vscode and other tools that
// call `jest` directly.  However, unless you are doing anything special
// do not edit this file

const standard = require('@grafana/toolkit/src/config/jest.plugin.config');

// This process will use the same config that `yarn test` is using
const config = standard.jestConfig();
// Adding jest-environment-jsdom-fifteen because the jsdom included with @grafana/toolkit doesn't play nice with the current version of @testing-library
config.testEnvironment = 'jest-environment-jsdom-fifteen';
config.setupFilesAfterEnv = [
  '<rootDir>/src/test/setupTests.ts',
  '@testing-library/jest-dom/extend-expect',
  ...(config.setupFilesAfterEnv || []),
];
config.maxWorkers = 2;
config.moduleNameMapper['\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$'] =
  '<rootDir>/src/test/fileMock.js';
module.exports = config;
