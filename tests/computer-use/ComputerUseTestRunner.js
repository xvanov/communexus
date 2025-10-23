// Computer Use Test Runner
// Uses Claude 3.5 Sonnet with Computer Use to automate testing
// Phase 3.5: E2E Testing with AI Vision

const Anthropic = require('@anthropic-ai/sdk');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class ComputerUseTestRunner {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is required. Set it in .env or pass it to the constructor.'
      );
    }

    this.client = new Anthropic({ apiKey: this.apiKey });
    // Use Claude Sonnet 4 (May 2025 release - current version)
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 1024;
    this.screenshotDir =
      config.screenshotDir ||
      path.join(__dirname, '../../test-results/computer-use');
    this.deviceId = config.deviceId || null; // iOS Simulator UDID
    this.appBundleId = config.appBundleId || 'host.exp.Exponent'; // Expo Go by default

    this.conversationHistory = [];
    this.testResults = [];
  }

  /**
   * Initialize the test environment
   */
  async initialize() {
    // Create screenshot directory
    await fs.mkdir(this.screenshotDir, { recursive: true });

    // Find simulator if not specified
    if (!this.deviceId) {
      await this.findSimulator();
    }

    console.log(`📱 Using simulator: ${this.deviceId}`);
    console.log(`📦 App bundle: ${this.appBundleId}`);
  }

  /**
   * Find a booted iOS Simulator
   */
  async findSimulator() {
    try {
      const { stdout } = await execAsync(
        'xcrun simctl list devices booted --json'
      );
      const devices = JSON.parse(stdout);

      // Get first booted device
      for (const runtime in devices.devices) {
        const bootedDevices = devices.devices[runtime].filter(
          d => d.state === 'Booted'
        );
        if (bootedDevices.length > 0) {
          this.deviceId = bootedDevices[0].udid;
          console.log(
            `✅ Found booted simulator: ${bootedDevices[0].name} (${this.deviceId})`
          );
          return;
        }
      }

      throw new Error(
        'No booted simulator found. Please start the iOS Simulator.'
      );
    } catch (error) {
      throw new Error(`Failed to find simulator: ${error.message}`);
    }
  }

  /**
   * Take a screenshot of the simulator
   */
  async takeScreenshot(name = 'screenshot') {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    try {
      await execAsync(
        `xcrun simctl io ${this.deviceId} screenshot "${filepath}"`
      );
      console.log(`📸 Screenshot saved: ${filename}`);

      // Read and encode as base64
      const imageBuffer = await fs.readFile(filepath);
      return {
        path: filepath,
        base64: imageBuffer.toString('base64'),
        filename,
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Send a message to Claude with optional screenshot
   */
  async sendMessage(instruction, includeScreenshot = true) {
    const messages = [...this.conversationHistory];

    // Add new user message
    const content = [];

    if (includeScreenshot) {
      const screenshot = await this.takeScreenshot(
        `step-${messages.length + 1}`
      );
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: screenshot.base64,
        },
      });
    }

    content.push({
      type: 'text',
      text: instruction,
    });

    messages.push({
      role: 'user',
      content,
    });

    console.log(`💭 Asking Claude: "${instruction}"`);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages,
      });

      // Add assistant response to history
      this.conversationHistory = messages;
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      return response;
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Ask Claude to analyze the current screen
   */
  async analyzeScreen(question) {
    const response = await this.sendMessage(question, true);
    const textContent = response.content.find(c => c.type === 'text');
    return textContent ? textContent.text : '';
  }

  /**
   * Tap at specific coordinates on the simulator
   */
  async tapAt(x, y) {
    try {
      await execAsync(`xcrun simctl io ${this.deviceId} tap ${x} ${y}`);
      console.log(`👆 Tapped at (${x}, ${y})`);
      await this.wait(500); // Wait for UI to respond
    } catch (error) {
      throw new Error(`Failed to tap: ${error.message}`);
    }
  }

  /**
   * Type text on the simulator
   */
  async typeText(text) {
    try {
      // Escape special characters for shell
      const escapedText = text.replace(/'/g, "'\\''");
      await execAsync(
        `xcrun simctl io ${this.deviceId} sendText '${escapedText}'`
      );
      console.log(`⌨️  Typed: "${text}"`);
      await this.wait(300);
    } catch (error) {
      throw new Error(`Failed to type text: ${error.message}`);
    }
  }

  /**
   * Wait for specified milliseconds
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run a test assertion with Claude
   */
  async assert(description, expectedAnswer = 'yes') {
    console.log(`🔍 Asserting: ${description}`);
    const response = await this.analyzeScreen(
      `${description} Please answer with just "yes" or "no".`
    );

    const answer = response.toLowerCase().trim();
    const passed = answer.includes(expectedAnswer.toLowerCase());

    this.testResults.push({
      description,
      expected: expectedAnswer,
      actual: answer,
      passed,
    });

    if (passed) {
      console.log(`✅ PASS: ${description}`);
    } else {
      console.log(`❌ FAIL: ${description}`);
      console.log(`   Expected: ${expectedAnswer}, Got: ${answer}`);
    }

    return passed;
  }

  /**
   * Reset conversation history
   */
  resetConversation() {
    this.conversationHistory = [];
    console.log('🔄 Conversation reset');
  }

  /**
   * Get test results summary
   */
  getResults() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
      results: this.testResults,
    };
  }

  /**
   * Print test results
   */
  printResults() {
    const summary = this.getResults();
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests:  ${summary.total}`);
    console.log(`✅ Passed:    ${summary.passed}`);
    console.log(`❌ Failed:    ${summary.failed}`);
    console.log(`📈 Pass Rate: ${summary.passRate}%`);
    console.log('='.repeat(60) + '\n');

    if (summary.failed > 0) {
      console.log('❌ Failed Tests:');
      summary.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.description}`);
          console.log(`    Expected: ${r.expected}, Got: ${r.actual}`);
        });
      console.log('');
    }
  }
}

module.exports = ComputerUseTestRunner;
