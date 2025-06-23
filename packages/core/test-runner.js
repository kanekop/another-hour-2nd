// Simple test runner to diagnose the issue
const { execSync } = require('child_process');

console.log('Running TypeScript compilation check...');
try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✓ TypeScript compilation successful');
} catch (error) {
    console.error('✗ TypeScript compilation failed');
    process.exit(1);
}

console.log('\nRunning Jest with minimal configuration...');
try {
    execSync('npx jest --runInBand --no-cache --detectOpenHandles tests/time-calculation.test.ts', { 
        stdio: 'inherit',
        timeout: 30000
    });
} catch (error) {
    console.error('Jest execution failed');
    process.exit(1);
}