/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: 'lib/cjs/src/tests',
  moduleNameMapper: {
    '^@_linked/core/(.*)\\.js$': '<rootDir>/../../../../../core/lib/cjs/$1',
    '^@_linked/core/(.*)$': '<rootDir>/../../../../../core/lib/cjs/$1',
    '^@_linked/core$': '<rootDir>/../../../../../core/lib/cjs/index.js',
    '^linked-js/(.*)\\.js$': '<rootDir>/../../../../../linked-js/lib/cjs/$1',
    '^linked-js/(.*)$': '<rootDir>/../../../../../linked-js/lib/cjs/$1',
    '^linked-js$': '<rootDir>/../../../../../linked-js/lib/cjs/index.js',
  },
};
