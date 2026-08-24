module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/src/__mocks__/expoSqliteMock.js',
    '^react-native$': '<rootDir>/src/__mocks__/reactNativeMock.js',
  },
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)', '**src/**/*.test.(ts|tsx)'],
};
