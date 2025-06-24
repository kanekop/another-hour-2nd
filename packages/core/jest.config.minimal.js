// Minimal Jest configuration for debugging
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/time-calculation.test.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                module: 'commonjs',
                target: 'ES2020',
                esModuleInterop: true,
                allowJs: true,
                strict: true
            },
            isolatedModules: true,
            diagnostics: {
                warnOnly: true
            }
        }]
    },
    testTimeout: 5000,
    verbose: true
};