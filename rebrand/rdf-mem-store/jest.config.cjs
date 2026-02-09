/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src/tests',
  testMatch: ['**/models.test.ts', '**/query-minimal.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../../tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@_linked/core/(.*)\\.js$': '<rootDir>/../../../core/src/$1',
    '^@_linked/core$': '<rootDir>/../../../core/src/index.ts',
    '^next-tick$': '<rootDir>/../../node_modules/next-tick',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
