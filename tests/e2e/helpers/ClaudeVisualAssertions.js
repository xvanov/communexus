// Claude Visual Assertions for Appium Tests
// Phase 3.5: Hybrid Appium + Claude Testing
// Uses Claude for visual verification while Appium handles interactions

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

class ClaudeVisualAssertions {
    constructor(config = {}) {
        // Check if visual assertions are enabled via flag
        const visualChecksEnabled = process.env.ENABLE_VISUAL_CHECKS === 'true';
        
        this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
        if (!this.apiKey || !visualChecksEnabled) {
            if (!visualChecksEnabled) {
                console.log('ℹ️  Visual assertions disabled (set ENABLE_VISUAL_CHECKS=true to enable)');
            } else {
                console.warn('⚠️  ANTHROPIC_API_KEY not set - visual assertions will be skipped');
            }
            this.enabled = false;
            return;
        }

        this.enabled = true;
        this.client = new Anthropic({ apiKey: this.apiKey });
        this.model = config.model || 'claude-sonnet-4-20250514';
        this.maxTokens = config.maxTokens || 512; // Shorter responses for yes/no
        this.screenshotDir = config.screenshotDir || path.join(__dirname, '../../../test-results/visual-assertions');
        this.conversationHistory = [];
        this.assertionResults = [];

        // Initialize assertionResults even when disabled
        if (!this.assertionResults) {
            this.assertionResults = [];
        }
    }

    /**
     * Initialize the visual assertions system
     */
    async initialize() {
        if (!this.enabled) {
            console.log('ℹ️  Visual assertions disabled (no API key)');
            return;
        }

        // Create screenshot directory
        await fs.mkdir(this.screenshotDir, { recursive: true });
        console.log('🤖 Claude visual assertions enabled');
    }

    /**
     * Take a screenshot using Appium
     */
    async takeScreenshot(name = 'screenshot') {
        const timestamp = Date.now();
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(this.screenshotDir, filename);

        await browser.saveScreenshot(filepath);
        
        // Read and encode as base64
        const imageBuffer = await fs.readFile(filepath);
        return {
            path: filepath,
            base64: imageBuffer.toString('base64'),
            filename
        };
    }

    /**
     * Ask Claude a question about the current screen
     */
    async askClaude(question, includeScreenshot = true) {
        if (!this.enabled) {
            console.log(`ℹ️  Skipping visual check: ${question}`);
            return 'skipped';
        }

        const content = [];
        
        if (includeScreenshot) {
            const screenshot = await this.takeScreenshot(`query-${this.assertionResults.length + 1}`);
            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: screenshot.base64
                }
            });
        }

        content.push({
            type: 'text',
            text: question
        });

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{
                    role: 'user',
                    content
                }]
            });

            const textContent = response.content.find(c => c.type === 'text');
            return textContent ? textContent.text : '';
        } catch (error) {
            console.error(`❌ Claude API error: ${error.message}`);
            return 'error';
        }
    }

    /**
     * Visual assertion - Ask Claude to verify something on screen
     */
    async visualAssert(description, expectedAnswer = 'yes') {
        if (!this.enabled) {
            console.log(`⏭️  Skipping: ${description}`);
            return { passed: true, skipped: true };
        }

        console.log(`👁️  Visual Check: ${description}`);
        
        const response = await this.askClaude(
            `${description} Please answer with just "yes" or "no".`,
            true
        );

        const answer = response.toLowerCase().trim();
        const passed = answer.includes(expectedAnswer.toLowerCase()) || response === 'skipped';

        const result = {
            description,
            expected: expectedAnswer,
            actual: answer,
            passed,
            skipped: response === 'skipped'
        };

        this.assertionResults.push(result);

        if (result.skipped) {
            console.log(`⏭️  SKIP: ${description} (no API key)`);
        } else if (passed) {
            console.log(`✅ PASS: ${description}`);
        } else {
            console.log(`❌ FAIL: ${description}`);
            console.log(`   Expected: ${expectedAnswer}, Got: ${answer}`);
        }

        return result;
    }

    /**
     * Get a description of what's currently on screen
     */
    async describeScreen() {
        if (!this.enabled) {
            return 'Visual assertions disabled - no API key';
        }

        console.log('📸 Asking Claude to describe the current screen...');
        return await this.askClaude(
            'Please describe what you see on this screen. Include: ' +
            '1) The main screen/page name, ' +
            '2) Key UI elements visible, ' +
            '3) Any text content, ' +
            '4) Current state (loading, error, success, etc.)',
            true
        );
    }

    /**
     * Get test results summary
     */
    getResults() {
        const total = this.assertionResults.length;
        const skipped = this.assertionResults.filter(r => r.skipped).length;
        const tested = total - skipped;
        const passed = this.assertionResults.filter(r => r.passed && !r.skipped).length;
        const failed = tested - passed;

        return {
            total,
            tested,
            passed,
            failed,
            skipped,
            passRate: tested > 0 ? ((passed / tested) * 100).toFixed(2) : 0,
            results: this.assertionResults
        };
    }

    /**
     * Print test results
     */
    printResults() {
        const summary = this.getResults();
        
        if (summary.total === 0) {
            return;
        }

        console.log('\n' + '='.repeat(60));
        console.log('👁️  CLAUDE VISUAL ASSERTION RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Assertions: ${summary.total}`);
        console.log(`✅ Passed:        ${summary.passed}`);
        console.log(`❌ Failed:        ${summary.failed}`);
        console.log(`⏭️  Skipped:       ${summary.skipped}`);
        console.log(`📈 Pass Rate:     ${summary.passRate}%`);
        console.log('='.repeat(60) + '\n');

        if (summary.failed > 0) {
            console.log('❌ Failed Visual Assertions:');
            summary.results.filter(r => !r.passed && !r.skipped).forEach(r => {
                console.log(`  - ${r.description}`);
                console.log(`    Expected: ${r.expected}, Got: ${r.actual}`);
            });
            console.log('');
        }
    }

    /**
     * Reset assertion history
     */
    reset() {
        this.assertionResults = [];
    }
}

module.exports = ClaudeVisualAssertions;


