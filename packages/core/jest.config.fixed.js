// Fixed Jest configuration
const path = require('path');

module.exports = {
    // Use Node test environment
    testEnvironment: 'node',
    
    // Set root directory
    rootDir: __dirname,
    
    // Test files location
    testMatch: [
        '<rootDir>/tests/**/*.test.ts'
    ],
    
    // Transform TypeScript files
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                target: 'ES2020',
                module: 'commonjs',
                lib: ['ES2020'],
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: false,
                forceConsistentCasingInFileNames: true,
                skipLibCheck: true,
                resolveJsonModule: true,
                moduleResolution: 'node',
                allowJs: true,
                noEmit: true,
                isolatedModules: true,
                sourceMap: false,
                declaration: false
            },
            isolatedModules: true,
            diagnostics: false
        }]
    },
    
    // Module paths
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    
    // File extensions
    moduleFileExtensions: ['ts', 'js', 'json'],
    
    // Performance settings
    testTimeout: 5000,
    maxWorkers: 1,
    
    // Disable coverage
    collectCoverage: false,
    
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    
    // Disable watch plugins
    watchPlugins: [],
    
    // Silent mode for better performance
    silent: false,
    verbose: true,
    
    // Cache settings
    cache: false,
    
    // Module paths resolution
    modulePaths: [
        '<rootDir>/src',
        '<rootDir>/node_modules'
    ],
    
    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    
    // Setup files
    setupFilesAfterEnv: [],
    
    // Globals
    globals: {}
};