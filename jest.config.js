module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/src/__mocks__/expoSqliteMock.js',
    '^react-native$': '<rootDir>/src/__mocks__/reactNativeMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  globals: {
    __DEV__: true,
  },
};
