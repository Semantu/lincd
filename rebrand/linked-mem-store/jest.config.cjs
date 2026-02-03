/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: 'lib/cjs/linked-mem-store/src/tests',
  moduleNameMapper: {
    '^linked-js/(.*)\\.js$': '<rootDir>/../../../../../../linked-js/lib/cjs/$1',
    '^linked-js/(.*)$': '<rootDir>/../../../../../../linked-js/lib/cjs/$1',
    '^linked-js$': '<rootDir>/../../../../../../linked-js/lib/cjs/index.js',
  },
};
