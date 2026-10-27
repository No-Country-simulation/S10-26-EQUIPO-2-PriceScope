// apps/api/jest.config.cjs
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // 💥 ESTA ES LA LÍNEA QUE FALTA PARA FIXEAR @nestjs/testing:
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs/testing|@nestjs/common|@nestjs/core)/)',
  ],
};