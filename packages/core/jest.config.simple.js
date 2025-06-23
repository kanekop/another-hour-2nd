// Simplified Jest configuration
module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.ts'],
    moduleFileExtensions: ['ts', 'js'],
    testTimeout: 5000,
    maxWorkers: 1,
    // Skip coverage entirely
    collectCoverage: false,
    // Disable watch mode plugins
    watchPlugins: [],
    // ts-jest configuration
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                target: 'ES2020',
                module: 'commonjs',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: false,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: false,
                resolveJsonModule: true,
                isolatedModules: true,
                noEmit: true
            },
            diagnostics: false,
            isolatedModules: true
        }]
    }
};