/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src/tests',
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
    '^@_linked/core/(.*)$': '<rootDir>/../../node_modules/@_linked/core/src/$1',
    '^@_linked/core$': '<rootDir>/../../node_modules/@_linked/core/src/index',
  },
};
