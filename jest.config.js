module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: [
    '**/src/**/__tests__/**/*.(ts|tsx|js)',
    '**/src/**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?|react-clone-referenced-element|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|@sentry))'
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}