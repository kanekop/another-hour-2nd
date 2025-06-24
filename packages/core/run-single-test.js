// Direct test runner without Jest
const { execSync } = require('child_process');
const path = require('path');

console.log('Compiling TypeScript...');
try {
    execSync('npx tsc', { stdio: 'inherit' });
    console.log('✓ TypeScript compilation successful');
} catch (error) {
    console.error('TypeScript compilation failed');
    process.exit(1);
}

console.log('\nRunning tests directly with Node...');
try {
    // Import and run a simple test
    const testFile = path.join(__dirname, 'dist', 'tests', 'time-calculation.test.js');
    console.log('Loading test file:', testFile);
    
    // Check if the file exists
    const fs = require('fs');
    if (!fs.existsSync(testFile)) {
        console.error('Test file not found:', testFile);
        console.log('Available files in dist:');
        execSync('find dist -name "*.js" | head -20', { stdio: 'inherit' });
        process.exit(1);
    }
    
    require(testFile);
    console.log('✓ Test loaded successfully');
} catch (error) {
    console.error('Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}