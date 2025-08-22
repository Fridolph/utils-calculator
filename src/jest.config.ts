import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['__tests__/**/*.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  transform: {
    "\\.[jt]sx?$": ["ts-jest, babel-jest", { "excludeJestPreset": true }],
  },
  moduleNameMapper: {
    '^(\\./index)$': ['src/index.ts'] // 显式指定模块路径
  },
  extensionsToTreatAsEsm: ['.ts']
}

export default config
