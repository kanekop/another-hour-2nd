// Direct test execution without Jest
console.log('Starting direct test...');

// Set up minimal test environment
global.describe = (name, fn) => {
    console.log(`\nTest Suite: ${name}`);
    fn();
};

global.test = global.it = (name, fn) => {
    console.log(`  Test: ${name}`);
    try {
        fn();
        console.log('    ✓ Passed');
    } catch (error) {
        console.log(`    ✗ Failed: ${error.message}`);
    }
};

global.expect = (actual) => ({
    toBe: (expected) => {
        if (actual !== expected) {
            throw new Error(`Expected ${expected} but got ${actual}`);
        }
    },
    toBeCloseTo: (expected, precision = 2) => {
        const diff = Math.abs(actual - expected);
        const pow = Math.pow(10, precision);
        if (Math.round(diff * pow) / pow > 0) {
            throw new Error(`Expected ${expected} but got ${actual}`);
        }
    }
});

// Load and run a simple test
console.log('\nLoading time-calculation module...');
const { getTimeScalingFactor } = require('./dist/time-calculation.js');

describe('Time Calculation Direct Test', () => {
    test('getTimeScalingFactor should return correct value', () => {
        const factor = getTimeScalingFactor(16);
        expect(factor).toBe(1.5);
    });
});

console.log('\nDirect test completed!');