#!/usr/bin/env node

/**
 * Hybrid Test Runner
 * 
 * Combines two testing approaches for optimal coverage:
 * 1. Appium (Fast, deterministic, great for repeated actions)
 * 2. Claude AI (Intelligent, visual validation, self-healing)
 * 
 * Strategy:
 * - Use Appium for fast interaction tests (30-60 seconds)
 * - Use Claude for visual validation and complex scenarios
 * - Run multi-device tests for messaging features
 * 
 * Usage:
 *   node scripts/agent/hybrid-test-runner.js --spec path/to/spec.json
 */

const { remote } = require('webdriverio');
const Anthropic = require('@anthropic-ai/sdk');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class HybridTestRunner {
  constructor(environment, config = {}) {
    this.environment = environment;
    this.config = {
      enableVisualChecks: config.enableVisualChecks !== false,
      enableMultiDevice: config.enableMultiDevice !== false,
      screenshotDir: config.screenshotDir || path.join(process.cwd(), 'test-results/agent-feedback'),
      claudeModel: config.claudeModel || 'claude-sonnet-4-20250514',
      appiumPort: config.appiumPort || 4723,
      ...config
    };

    // Initialize Claude AI if enabled
    if (this.config.enableVisualChecks) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn('⚠️  ANTHROPIC_API_KEY not set, visual checks disabled');
        this.config.enableVisualChecks = false;
      } else {
        this.claudeClient = new Anthropic({ apiKey });
      }
    }

    this.appiumDrivers = {};
    this.testResults = {
      fast: [],
      visual: [],
      multiDevice: []
    };
  }

  /**
   * Run all tests for a given task specification
   */
  async runTests(taskSpec) {
    console.log(`\n🧪 Running tests for: ${taskSpec.name || 'Unnamed Task'}\n`);

    const results = {
      taskName: taskSpec.name,
      timestamp: new Date().toISOString(),
      passed: false,
      details: {}
    };

    try {
      // 1. Run fast Appium tests
      if (taskSpec.appiumTests && taskSpec.appiumTests.length > 0) {
        console.log('⚡ Step 1: Running fast Appium tests...');
        results.details.fast = await this.runAppiumTests(taskSpec.appiumTests);
        console.log(`✅ Fast tests: ${results.details.fast.passed}/${results.details.fast.total} passed\n`);
      }

      // 2. Run visual validation with Claude (if fast tests passed)
      if (this.config.enableVisualChecks && taskSpec.visualChecks) {
        if (!results.details.fast || results.details.fast.passed === results.details.fast.total) {
          console.log('👁️  Step 2: Running visual validation with Claude...');
          results.details.visual = await this.runVisualChecks(taskSpec.visualChecks);
          console.log(`✅ Visual checks: ${results.details.visual.passed}/${results.details.visual.total} passed\n`);
        } else {
          console.log('⏭️  Step 2: Skipping visual checks (fast tests failed)\n');
          results.details.visual = { skipped: true, reason: 'Fast tests failed' };
        }
      }

      // 3. Run multi-device messaging tests (if applicable)
      if (this.config.enableMultiDevice && taskSpec.multiDeviceTests) {
        console.log('📱📱 Step 3: Running multi-device messaging tests...');
        results.details.multiDevice = await this.runMultiDeviceTests(taskSpec.multiDeviceTests);
        console.log(`✅ Multi-device: ${results.details.multiDevice.passed}/${results.details.multiDevice.total} passed\n`);
      }

      // Calculate overall pass/fail
      results.passed = this.calculateOverallResult(results.details);
      results.summary = this.generateSummary(results);

      return results;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      results.passed = false;
      results.error = error.message;
      return results;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Run Appium tests
   */
  async runAppiumTests(testConfigs) {
    const results = {
      total: testConfigs.length,
      passed: 0,
      failed: 0,
      tests: []
    };

    // Connect to first simulator
    const simulator = this.environment.simulators[0];
    const driver = await this.getAppiumDriver(simulator);

    for (const testConfig of testConfigs) {
      console.log(`  Running: ${testConfig.name}...`);
      
      try {
        const testResult = await this.runSingleAppiumTest(driver, testConfig);
        results.tests.push(testResult);
        
        if (testResult.passed) {
          results.passed++;
          console.log(`  ✅ ${testConfig.name}`);
        } else {
          results.failed++;
          console.log(`  ❌ ${testConfig.name}: ${testResult.error}`);
        }
      } catch (error) {
        results.failed++;
        results.tests.push({
          name: testConfig.name,
          passed: false,
          error: error.message
        });
        console.log(`  ❌ ${testConfig.name}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Run a single Appium test
   */
  async runSingleAppiumTest(driver, testConfig) {
    const startTime = Date.now();
    
    try {
      // Execute test steps
      for (const step of testConfig.steps) {
        await this.executeAppiumStep(driver, step);
      }

      // Run assertions
      for (const assertion of testConfig.assertions || []) {
        await this.executeAppiumAssertion(driver, assertion);
      }

      return {
        name: testConfig.name,
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // Take screenshot on failure
      const screenshot = await driver.takeScreenshot();
      const screenshotPath = await this.saveScreenshot(screenshot, `appium-fail-${testConfig.name}`);

      return {
        name: testConfig.name,
        passed: false,
        error: error.message,
        screenshot: screenshotPath,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute an Appium test step
   */
  async executeAppiumStep(driver, step) {
    switch (step.action) {
      case 'tap':
        const element = await driver.$(`~${step.testID}`);
        await element.waitForDisplayed({ timeout: 5000 });
        await element.click();
        break;

      case 'type':
        const input = await driver.$(`~${step.testID}`);
        await input.waitForDisplayed({ timeout: 5000 });
        await input.setValue(step.text);
        break;

      case 'wait':
        await driver.pause(step.duration || 1000);
        break;

      case 'swipe':
        await driver.execute('mobile: swipe', {
          direction: step.direction || 'up'
        });
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  /**
   * Execute an Appium assertion
   */
  async executeAppiumAssertion(driver, assertion) {
    switch (assertion.type) {
      case 'elementVisible':
        const element = await driver.$(`~${assertion.testID}`);
        const isDisplayed = await element.isDisplayed();
        if (!isDisplayed) {
          throw new Error(`Element ${assertion.testID} not visible`);
        }
        break;

      case 'elementText':
        const textElement = await driver.$(`~${assertion.testID}`);
        const text = await textElement.getText();
        if (!text.includes(assertion.expectedText)) {
          throw new Error(`Element text "${text}" does not contain "${assertion.expectedText}"`);
        }
        break;

      default:
        throw new Error(`Unknown assertion: ${assertion.type}`);
    }
  }

  /**
   * Run visual validation checks with Claude AI
   */
  async runVisualChecks(checks) {
    const results = {
      total: checks.length,
      passed: 0,
      failed: 0,
      checks: []
    };

    const simulator = this.environment.simulators[0];

    for (const check of checks) {
      console.log(`  Checking: ${check.description}...`);

      try {
        const screenshot = await this.takeSimulatorScreenshot(simulator.udid, `visual-${Date.now()}`);
        const passed = await this.askClaude(screenshot, check.question, check.expectedAnswer);

        results.checks.push({
          description: check.description,
          question: check.question,
          expectedAnswer: check.expectedAnswer,
          passed,
          screenshot: screenshot.path
        });

        if (passed) {
          results.passed++;
          console.log(`  ✅ ${check.description}`);
        } else {
          results.failed++;
          console.log(`  ❌ ${check.description}`);
        }
      } catch (error) {
        results.failed++;
        results.checks.push({
          description: check.description,
          passed: false,
          error: error.message
        });
        console.log(`  ❌ ${check.description}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Ask Claude AI to analyze a screenshot
   */
  async askClaude(screenshot, question, expectedAnswer = 'yes') {
    const response = await this.claudeClient.messages.create({
      model: this.config.claudeModel,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot.base64
              }
            },
            {
              type: 'text',
              text: `${question}\n\nPlease answer with just "yes" or "no".`
            }
          ]
        }
      ]
    });

    const answer = response.content[0].text.toLowerCase().trim();
    return answer.includes(expectedAnswer.toLowerCase());
  }

  /**
   * Run multi-device messaging tests
   */
  async runMultiDeviceTests(tests) {
    const results = {
      total: tests.length,
      passed: 0,
      failed: 0,
      tests: []
    };

    // Get both simulators
    const alice = this.environment.simulators.find(s => s.role === 'alice');
    const bob = this.environment.simulators.find(s => s.role === 'bob');

    if (!alice || !bob) {
      throw new Error('Multi-device tests require two simulators (alice and bob)');
    }

    // Get Appium drivers for both
    const aliceDriver = await this.getAppiumDriver(alice);
    const bobDriver = await this.getAppiumDriver(bob);

    for (const test of tests) {
      console.log(`  Running: ${test.name}...`);

      try {
        const testResult = await this.runMultiDeviceTest(
          { driver: aliceDriver, simulator: alice },
          { driver: bobDriver, simulator: bob },
          test
        );

        results.tests.push(testResult);

        if (testResult.passed) {
          results.passed++;
          console.log(`  ✅ ${test.name}`);
        } else {
          results.failed++;
          console.log(`  ❌ ${test.name}: ${testResult.error}`);
        }
      } catch (error) {
        results.failed++;
        results.tests.push({
          name: test.name,
          passed: false,
          error: error.message
        });
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Run a single multi-device test
   */
  async runMultiDeviceTest(alice, bob, test) {
    const startTime = Date.now();

    try {
      // Execute steps on alice's device
      if (test.aliceSteps) {
        for (const step of test.aliceSteps) {
          await this.executeAppiumStep(alice.driver, step);
        }
      }

      // Wait for sync
      await alice.driver.pause(test.syncDelay || 2000);

      // Execute steps on bob's device
      if (test.bobSteps) {
        for (const step of test.bobSteps) {
          await this.executeAppiumStep(bob.driver, step);
        }
      }

      // Visual validation on bob's screen (if specified)
      if (test.bobVisualCheck) {
        const screenshot = await this.takeSimulatorScreenshot(bob.simulator.udid, `multi-device-${test.name}`);
        const passed = await this.askClaude(
          screenshot,
          test.bobVisualCheck.question,
          test.bobVisualCheck.expectedAnswer
        );

        if (!passed) {
          throw new Error('Bob visual check failed');
        }
      }

      return {
        name: test.name,
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // Take screenshots of both devices on failure
      const aliceScreenshot = await this.takeSimulatorScreenshot(alice.simulator.udid, `alice-fail-${test.name}`);
      const bobScreenshot = await this.takeSimulatorScreenshot(bob.simulator.udid, `bob-fail-${test.name}`);

      return {
        name: test.name,
        passed: false,
        error: error.message,
        screenshots: {
          alice: aliceScreenshot.path,
          bob: bobScreenshot.path
        },
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get or create Appium driver for a simulator
   */
  async getAppiumDriver(simulator) {
    if (this.appiumDrivers[simulator.udid]) {
      return this.appiumDrivers[simulator.udid];
    }

    const driver = await remote({
      hostname: 'localhost',
      port: this.config.appiumPort,
      path: '/',
      capabilities: {
        platformName: 'iOS',
        'appium:platformVersion': '17.5',
        'appium:deviceName': simulator.name,
        'appium:udid': simulator.udid,
        'appium:automationName': 'XCUITest',
        'appium:bundleId': this.environment.appBundleId,
        'appium:noReset': true,
        'appium:fullReset': false,
        'appium:autoAcceptAlerts': true
      }
    });

    this.appiumDrivers[simulator.udid] = driver;
    return driver;
  }

  /**
   * Take simulator screenshot using simctl
   */
  async takeSimulatorScreenshot(udid, name) {
    await fs.mkdir(this.config.screenshotDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.config.screenshotDir, filename);

    await execAsync(`xcrun simctl io ${udid} screenshot "${filepath}"`);

    const imageBuffer = await fs.readFile(filepath);
    return {
      path: filepath,
      base64: imageBuffer.toString('base64'),
      filename
    };
  }

  /**
   * Save base64 screenshot
   */
  async saveScreenshot(base64Data, name) {
    await fs.mkdir(this.config.screenshotDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.config.screenshotDir, filename);

    await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));
    return filepath;
  }

  /**
   * Calculate overall test result
   */
  calculateOverallResult(details) {
    const categories = ['fast', 'visual', 'multiDevice'];
    
    for (const category of categories) {
      const result = details[category];
      if (result && !result.skipped) {
        if (result.failed > 0) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Generate test summary
   */
  generateSummary(results) {
    const lines = [];
    
    if (results.details.fast) {
      lines.push(`Fast Tests: ${results.details.fast.passed}/${results.details.fast.total} passed`);
    }
    
    if (results.details.visual && !results.details.visual.skipped) {
      lines.push(`Visual Checks: ${results.details.visual.passed}/${results.details.visual.total} passed`);
    }
    
    if (results.details.multiDevice) {
      lines.push(`Multi-Device: ${results.details.multiDevice.passed}/${results.details.multiDevice.total} passed`);
    }

    return lines.join(', ');
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Close all Appium drivers
    for (const udid in this.appiumDrivers) {
      try {
        await this.appiumDrivers[udid].deleteSession();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.appiumDrivers = {};
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const specIndex = args.indexOf('--spec');
  
  if (specIndex === -1 || !args[specIndex + 1]) {
    console.error('Usage: node hybrid-test-runner.js --spec path/to/spec.json');
    process.exit(1);
  }

  const specPath = args[specIndex + 1];

  try {
    // Load environment state
    const envStatePath = path.join(process.cwd(), '.agent-env-state.json');
    const envState = JSON.parse(await fs.readFile(envStatePath, 'utf-8'));

    // Load test specification
    const testSpec = JSON.parse(await fs.readFile(specPath, 'utf-8'));

    // Run tests
    const runner = new HybridTestRunner(envState);
    const results = await runner.runTests(testSpec);

    // Print results
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(results.passed ? '✅ TESTS PASSED' : '❌ TESTS FAILED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Task: ${results.taskName}`);
    console.log(`Summary: ${results.summary}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Save results
    const resultsPath = path.join(process.cwd(), 'test-results/agent-feedback', 'latest-results.json');
    await fs.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    process.exit(results.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  main();
}

module.exports = HybridTestRunner;

