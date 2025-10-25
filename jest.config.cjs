module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  watchman: false, // Disable watchman to avoid permission issues
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'functions/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/ai/', // Skip AI tests temporarily
    '/tests/computer-use/',
    '/tests/integration/auth_emulator.test.ts', // Requires emulator (use test:emul)
    '/tests/integration/crud_threads.test.ts', // Requires emulator (use test:emul)
  ],
  // setupFilesAfterEnv removed - file doesn't exist
};
