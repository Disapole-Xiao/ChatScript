import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest', // 使用 ts-jest 预设
  testEnvironment: 'node', // 设置测试环境为 Node.js
  transform: {
    '^.+\\.ts$': 'ts-jest', // 使用 ts-jest 编译 TypeScript 文件
  },
  moduleFileExtensions: ['ts', 'js', 'json'], // Jest 要处理的文件扩展名
  testMatch: ['**/tests/**/*.ts'], // 定义测试文件的路径模式
};

export default config;
