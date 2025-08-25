// jest.config.ts
export default {
  rootDir: './src',                          // 根目录
  preset: 'ts-jest',                    // 使用ts-jest预设
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.ts'], // 测试目录
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  transform: {
    '\\.[jt]sx?$': ['ts-jest', { 
      useESM: true,                     // 启用ESM支持
      babelConfig: true,                // 使用Babel
    }],
  },
  moduleNameMapper: {
    '^utils-calculator$': '<rootDir>/src/index.ts', // 显式指定模块
    '^(\\./.*\\.(jpg|jpeg|png|gif|eot|otf|ttf|woff|woff2|svg|css|scss|less))': '<rootDir>/__mocks__/fileMock.js', // 静态资源处理
  },
  extensionsToTreatAsEsm: ['.ts'],     // 显式指定ESM扩展名
};