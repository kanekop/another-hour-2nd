// Debug test runner
console.log('Starting debug test...');

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for debugging
process.env.DEBUG = 'jest:*';
process.env.NODE_OPTIONS = '--trace-warnings';

const jestPath = path.join(__dirname, 'node_modules', '.bin', 'jest');
const args = [
    '--no-cache',
    '--detectOpenHandles',
    '--forceExit',
    '--runInBand',
    '--verbose',
    'tests/time-calculation.test.ts'
];

console.log('Running command:', jestPath, args.join(' '));

const jest = spawn(jestPath, args, {
    stdio: 'inherit',
    shell: true
});

jest.on('error', (err) => {
    console.error('Failed to start Jest:', err);
});

jest.on('exit', (code) => {
    console.log('Jest exited with code:', code);
    process.exit(code);
});