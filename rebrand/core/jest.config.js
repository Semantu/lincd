/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src/tests',
  testMatch: [
    '**/query.test.ts',
    '**/query.types.test.ts',
    '**/metadata.test.ts',
    '**/store-routing.test.ts',
    '**/core-utils.test.ts',
  ],
  testPathIgnorePatterns: ['/old/'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../../tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
