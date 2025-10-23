// Authentication Flow Test - Computer Use Version
// Phase 3.5: E2E Testing with AI Vision
// Uses Claude 3.5 Sonnet to interact with the app like a human

const ComputerUseTestRunner = require('./ComputerUseTestRunner');

async function runAuthTests() {
    console.log('🚀 Starting Computer Use Auth Tests\n');
    
    const runner = new ComputerUseTestRunner({
        appBundleId: 'host.exp.Exponent' // Expo Go
    });

    try {
        // Initialize
        await runner.initialize();
        console.log('✅ Test runner initialized\n');

        // Test 1: Verify auth screen is displayed
        console.log('📋 Test 1: Verify auth screen is displayed');
        await runner.assert(
            'Is this the authentication screen with email and password input fields?',
            'yes'
        );
        await runner.wait(1000);

        // Test 2: Check if demo user button exists
        console.log('\n📋 Test 2: Check for demo user button');
        await runner.assert(
            'Is there a "Try Demo User" or "Test User" button visible on this screen?',
            'yes'
        );
        await runner.wait(1000);

        // Test 3: Attempt to use email login
        console.log('\n📋 Test 3: Test email input interaction');
        
        // Ask Claude to find the email input coordinates
        const emailLocation = await runner.analyzeScreen(
            'What are the X,Y coordinates of the email input field? Reply with just the numbers like "196,450"'
        );
        
        console.log(`📍 Email input location: ${emailLocation}`);
        
        // Parse coordinates and tap
        const [x, y] = emailLocation.match(/\d+/g).map(Number);
        if (x && y) {
            await runner.tapAt(x, y);
            await runner.wait(500);
            
            // Type test email
            await runner.typeText('john@test.com');
            await runner.wait(500);
            
            await runner.assert(
                'Is the email input field now filled with "john@test.com"?',
                'yes'
            );
        }

        // Test 4: Sign in with demo user
        console.log('\n📋 Test 4: Sign in with demo user');
        
        // Find and tap demo user button
        const demoButtonLocation = await runner.analyzeScreen(
            'What are the X,Y coordinates of the "Try Demo User" button? Reply with just the numbers like "196,450"'
        );
        
        console.log(`📍 Demo button location: ${demoButtonLocation}`);
        
        const [demoX, demoY] = demoButtonLocation.match(/\d+/g).map(Number);
        if (demoX && demoY) {
            await runner.tapAt(demoX, demoY);
            await runner.wait(3000); // Wait for alert to appear
            
            // Handle the demo user selection alert
            const alertAnalysis = await runner.analyzeScreen(
                'Is there an alert/popup visible asking to choose a demo user (John, Jane, Alice, Bob)?'
            );
            
            if (alertAnalysis.toLowerCase().includes('yes')) {
                console.log('📱 Alert detected, selecting John...');
                
                // Find and tap John button in alert
                const johnButtonLocation = await runner.analyzeScreen(
                    'What are the X,Y coordinates of the "John" option in the alert? Reply with just numbers like "196,450"'
                );
                
                const [johnX, johnY] = johnButtonLocation.match(/\d+/g).map(Number);
                if (johnX && johnY) {
                    await runner.tapAt(johnX, johnY);
                    await runner.wait(5000); // Wait for login to complete
                }
            }
        }

        // Test 5: Verify successful login
        console.log('\n📋 Test 5: Verify successful login to chat list');
        await runner.assert(
            'Is this the chat list screen showing "Communexus" at the top with a logout button?',
            'yes'
        );

        // Test 6: Verify user info displayed
        console.log('\n📋 Test 6: Check user info display');
        await runner.assert(
            'Is the current user email (john@test.com or similar) displayed on this screen?',
            'yes'
        );

        // Test 7: Test logout functionality
        console.log('\n📋 Test 7: Test logout');
        
        const logoutLocation = await runner.analyzeScreen(
            'What are the X,Y coordinates of the logout button? Reply with just numbers like "196,450"'
        );
        
        console.log(`📍 Logout button location: ${logoutLocation}`);
        
        const [logoutX, logoutY] = logoutLocation.match(/\d+/g).map(Number);
        if (logoutX && logoutY) {
            await runner.tapAt(logoutX, logoutY);
            await runner.wait(2000); // Wait for logout
            
            // Verify back on auth screen
            await runner.assert(
                'Are we back on the authentication screen with email and password inputs?',
                'yes'
            );
        }

        // Print results
        console.log('\n');
        runner.printResults();

        const summary = runner.getResults();
        if (summary.failed > 0) {
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
runAuthTests();


