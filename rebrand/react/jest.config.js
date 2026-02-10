/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: 'src/tests',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../../tsconfig-test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@_linked/core/(.*)$': '<rootDir>/../../../core/src/$1',
    '^@_linked/core$': '<rootDir>/../../../core/src/index',
    '^@_linked/rdf-mem-store/(.*)$': '<rootDir>/../../../rdf-mem-store/src/$1',
    '^@_linked/rdf-mem-store$': '<rootDir>/../../../rdf-mem-store/src/index',
    '^@_linked/react/(.*)$': '<rootDir>/../$1',
    '^@_linked/react$': '<rootDir>/../index',
  },
};
