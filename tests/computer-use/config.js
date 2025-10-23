// Computer Use Test Configuration
// Phase 3.5: E2E Testing with AI Vision

module.exports = {
    // Claude API settings
    anthropic: {
        // Current model: Claude Sonnet 4 (May 2025)
        // Alternative models if needed:
        // - 'claude-3-5-sonnet-20240620' (older, may not support Computer Use)
        // - 'claude-3-opus-20240229' (older, more expensive)
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1024,
        apiKey: process.env.ANTHROPIC_API_KEY
    },

    // iOS Simulator settings
    simulator: {
        deviceId: null, // Auto-detect if null
        appBundleId: 'host.exp.Exponent', // Expo Go
        // For EAS dev build, use: 'com.communexus.communexus'
    },

    // Screenshot settings
    screenshots: {
        directory: './test-results/computer-use',
        format: 'png'
    },

    // Timing settings (in milliseconds)
    timing: {
        afterClick: 500,
        afterType: 300,
        afterScreenChange: 2000,
        betweenTests: 1000
    },

    // Test users
    testUsers: {
        user1: {
            email: 'john@test.com',
            password: 'password'
        },
        user2: {
            email: 'jane@test.com',
            password: 'password'
        },
        user3: {
            email: 'alice@test.com',
            password: 'password'
        },
        user4: {
            email: 'bob@test.com',
            password: 'password'
        }
    }
};

