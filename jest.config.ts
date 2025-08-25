// jest.config.ts
export default {
  rootDir: '.', // 根目录
  preset: 'ts-jest', // 使用ts-jest预设
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.ts', // 匹配 src 下所有 __tests__ 子目录中的 .ts 文件
    '<rootDir>/src/**/*.{spec,test}.ts', // 可选：匹配 src 下所有 *.spec.ts 或 *.test.ts 文件
    '<rootDir>/src/tests/**/*.ts', // 确保原来的 tests 目录也被包含
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: false,
  // collectCoverage: true,
  // coverageReporters: ['text', 'lcov'],
  // coverageDirectory: 'coverage',
  transform: {
    '\\.[jt]sx?$': [
      'ts-jest',
      {
        useESM: true, // 启用ESM支持
        babelConfig: true, // 使用Babel
      },
    ],
  },
  moduleNameMapper: {
    '^utils-calculator$': '<rootDir>/src/index.ts', // 显式指定模块
    '^(\\./.*\\.(jpg|jpeg|png|gif|eot|otf|ttf|woff|woff2|svg|css|scss|less))':
      '<rootDir>/__mocks__/fileMock.js', // 静态资源处理
  },
  extensionsToTreatAsEsm: ['.ts'], // 显式指定ESM扩展名
}
