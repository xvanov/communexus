#!/usr/bin/env node

/**
 * Feedback Collector
 * 
 * Aggregates all feedback from the test environment for the AI agent:
 * - Test results (pass/fail, details, screenshots)
 * - Build logs and errors
 * - Firebase logs
 * - Simulator logs
 * - Performance metrics
 * 
 * Generates structured feedback that the AI can use to:
 * - Understand what failed
 * - See visual evidence (screenshots)
 * - Identify patterns
 * - Make informed decisions about fixes
 * 
 * Usage:
 *   const collector = new FeedbackCollector();
 *   const feedback = await collector.collect(testResults, buildLogs);
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FeedbackCollector {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      feedbackDir: config.feedbackDir || path.join(process.cwd(), 'feedback/agent'),
      screenshotDir: config.screenshotDir || path.join(process.cwd(), 'test-results/agent-feedback'),
      maxLogLines: config.maxLogLines || 100,
      ...config
    };
  }

  /**
   * Collect all feedback for a test run
   */
  async collect(testResults, buildLogs = null) {
    console.log('\n📊 Collecting feedback...\n');

    const feedback = {
      timestamp: new Date().toISOString(),
      taskName: testResults.taskName || 'Unknown Task',
      overallResult: testResults.passed ? 'PASSED' : 'FAILED',
      build: null,
      tests: null,
      logs: null,
      screenshots: null,
      suggestions: null,
      metadata: {
        duration: null,
        environment: await this.getEnvironmentInfo()
      }
    };

    try {
      // 1. Collect build information
      if (buildLogs) {
        console.log('  📦 Analyzing build logs...');
        feedback.build = await this.analyzeBuildLogs(buildLogs);
      }

      // 2. Analyze test results
      console.log('  🧪 Analyzing test results...');
      feedback.tests = await this.analyzeTestResults(testResults);

      // 3. Collect logs
      console.log('  📝 Collecting system logs...');
      feedback.logs = await this.collectLogs();

      // 4. Collect screenshots
      console.log('  📸 Collecting screenshots...');
      feedback.screenshots = await this.collectScreenshots();

      // 5. Generate suggestions
      console.log('  💡 Generating suggestions...');
      feedback.suggestions = await this.generateSuggestions(feedback);

      // 6. Calculate duration
      feedback.metadata.duration = this.calculateDuration(testResults);

      // 7. Save feedback
      await this.saveFeedback(feedback);

      console.log('✅ Feedback collected successfully\n');
      return feedback;
    } catch (error) {
      console.error('❌ Failed to collect feedback:', error.message);
      feedback.error = error.message;
      return feedback;
    }
  }

  /**
   * Analyze build logs for errors
   */
  async analyzeBuildLogs(buildLogs) {
    const analysis = {
      success: buildLogs.exitCode === 0,
      exitCode: buildLogs.exitCode,
      errors: [],
      warnings: [],
      summary: ''
    };

    if (!buildLogs.output) {
      return analysis;
    }

    const lines = buildLogs.output.split('\n');

    // Parse for errors
    const errorRegex = /error:|Error:|ERROR:|❌|fatal:/i;
    const warningRegex = /warning:|Warning:|WARNING:|⚠️/i;

    for (const line of lines) {
      if (errorRegex.test(line)) {
        analysis.errors.push(line.trim());
      } else if (warningRegex.test(line)) {
        analysis.warnings.push(line.trim());
      }
    }

    // Generate summary
    if (analysis.success) {
      analysis.summary = 'Build completed successfully';
    } else {
      analysis.summary = `Build failed with ${analysis.errors.length} error(s)`;
    }

    return analysis;
  }

  /**
   * Analyze test results in detail
   */
  async analyzeTestResults(testResults) {
    const analysis = {
      overall: testResults.passed ? 'PASSED' : 'FAILED',
      categories: {},
      failedTests: [],
      passedTests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    // Analyze each category (fast, visual, multiDevice)
    for (const [category, results] of Object.entries(testResults.details || {})) {
      if (results.skipped) {
        analysis.categories[category] = {
          status: 'SKIPPED',
          reason: results.reason
        };
        continue;
      }

      analysis.categories[category] = {
        status: results.failed === 0 ? 'PASSED' : 'FAILED',
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        tests: []
      };

      // Extract individual test details
      const tests = results.tests || results.checks || [];
      for (const test of tests) {
        const testDetail = {
          name: test.name || test.description,
          passed: test.passed,
          duration: test.duration,
          error: test.error,
          screenshot: test.screenshot || test.screenshots
        };

        analysis.categories[category].tests.push(testDetail);

        if (test.passed) {
          analysis.passedTests.push(testDetail);
          analysis.summary.passed++;
        } else {
          analysis.failedTests.push(testDetail);
          analysis.summary.failed++;
        }
        analysis.summary.total++;
      }
    }

    return analysis;
  }

  /**
   * Collect system logs
   */
  async collectLogs() {
    const logs = {
      firebase: null,
      simulator: null,
      appium: null
    };

    try {
      // Collect recent Firebase logs (if available)
      const firebaseLogPath = path.join(this.config.projectRoot, 'firebase-debug.log');
      try {
        const firebaseLogs = await fs.readFile(firebaseLogPath, 'utf-8');
        logs.firebase = this.extractRecentLines(firebaseLogs, this.config.maxLogLines);
      } catch (error) {
        // No Firebase logs
      }

      // Collect iOS Simulator logs
      try {
        const { stdout } = await execAsync('xcrun simctl spawn booted log show --predicate \'processImagePath contains "Communexus"\' --last 5m');
        logs.simulator = this.extractRecentLines(stdout, this.config.maxLogLines);
      } catch (error) {
        // No simulator logs
      }

      return logs;
    } catch (error) {
      console.warn('⚠️  Could not collect some logs:', error.message);
      return logs;
    }
  }

  /**
   * Collect screenshots from test runs
   */
  async collectScreenshots() {
    const screenshots = {
      failed: [],
      all: []
    };

    try {
      const files = await fs.readdir(this.config.screenshotDir);
      const pngFiles = files.filter(f => f.endsWith('.png'));

      for (const file of pngFiles) {
        const filepath = path.join(this.config.screenshotDir, file);
        const stats = await fs.stat(filepath);

        const screenshot = {
          filename: file,
          path: filepath,
          size: stats.size,
          timestamp: stats.mtime,
          isFailed: file.includes('fail')
        };

        screenshots.all.push(screenshot);

        if (screenshot.isFailed) {
          screenshots.failed.push(screenshot);
        }
      }

      // Sort by timestamp (most recent first)
      screenshots.all.sort((a, b) => b.timestamp - a.timestamp);
      screenshots.failed.sort((a, b) => b.timestamp - a.timestamp);

      return screenshots;
    } catch (error) {
      console.warn('⚠️  Could not collect screenshots:', error.message);
      return screenshots;
    }
  }

  /**
   * Generate suggestions for the AI agent
   */
  async generateSuggestions(feedback) {
    const suggestions = [];

    // 1. Build errors
    if (feedback.build && !feedback.build.success) {
      suggestions.push({
        category: 'BUILD',
        priority: 'HIGH',
        issue: 'Build failed',
        details: feedback.build.errors.slice(0, 5),
        suggestion: 'Fix compilation errors. Check syntax, imports, and type errors.'
      });
    }

    // 2. Test failures
    if (feedback.tests && feedback.tests.failedTests.length > 0) {
      for (const test of feedback.tests.failedTests) {
        suggestions.push({
          category: 'TEST',
          priority: 'MEDIUM',
          issue: `Test failed: ${test.name}`,
          details: test.error,
          screenshot: test.screenshot,
          suggestion: this.inferTestFix(test)
        });
      }
    }

    // 3. Visual check failures
    if (feedback.tests?.categories?.visual?.failed > 0) {
      const visualTests = feedback.tests.categories.visual.tests.filter(t => !t.passed);
      for (const test of visualTests) {
        suggestions.push({
          category: 'VISUAL',
          priority: 'MEDIUM',
          issue: `Visual check failed: ${test.name}`,
          screenshot: test.screenshot,
          suggestion: 'Review screenshot to see what the UI actually looks like. The visual appearance may not match expectations.'
        });
      }
    }

    // 4. Multi-device failures
    if (feedback.tests?.categories?.multiDevice?.failed > 0) {
      suggestions.push({
        category: 'MULTI_DEVICE',
        priority: 'HIGH',
        issue: 'Multi-device messaging test failed',
        suggestion: 'Check real-time synchronization between devices. Verify Firebase listeners are working correctly.'
      });
    }

    // 5. No suggestions if everything passed
    if (suggestions.length === 0 && feedback.overallResult === 'PASSED') {
      suggestions.push({
        category: 'SUCCESS',
        priority: 'INFO',
        issue: null,
        suggestion: 'All tests passed! Ready to create PR.'
      });
    }

    return suggestions;
  }

  /**
   * Infer a fix suggestion for a test failure
   */
  inferTestFix(test) {
    const error = test.error?.toLowerCase() || '';

    // Element not found
    if (error.includes('not found') || error.includes('not visible')) {
      return `Element not found. Check that testID="${test.name}" exists in the UI and is visible. May need to add accessibility label or wait for element to appear.`;
    }

    // Timeout
    if (error.includes('timeout') || error.includes('timed out')) {
      return 'Test timed out. The element may be loading slowly or not appearing. Increase wait time or check if the UI flow has changed.';
    }

    // Text mismatch
    if (error.includes('does not contain') || error.includes('expected')) {
      return 'Text content mismatch. Check the actual text in the UI matches the expected text in the test.';
    }

    // Generic
    return 'Test assertion failed. Review the error message and screenshot to understand what went wrong.';
  }

  /**
   * Calculate test duration
   */
  calculateDuration(testResults) {
    let totalDuration = 0;

    for (const category in testResults.details) {
      const results = testResults.details[category];
      if (results.tests || results.checks) {
        const tests = results.tests || results.checks;
        for (const test of tests) {
          if (test.duration) {
            totalDuration += test.duration;
          }
        }
      }
    }

    return {
      total: totalDuration,
      formatted: `${(totalDuration / 1000).toFixed(2)}s`
    };
  }

  /**
   * Get environment information
   */
  async getEnvironmentInfo() {
    try {
      const envStatePath = path.join(this.config.projectRoot, '.agent-env-state.json');
      const envState = JSON.parse(await fs.readFile(envStatePath, 'utf-8'));
      return {
        simulators: envState.simulators?.length || 0,
        firebase: envState.firebase ? 'running' : 'unknown'
      };
    } catch (error) {
      return {
        simulators: 'unknown',
        firebase: 'unknown'
      };
    }
  }

  /**
   * Extract recent lines from logs
   */
  extractRecentLines(logs, maxLines) {
    const lines = logs.split('\n');
    return lines.slice(-maxLines).join('\n');
  }

  /**
   * Save feedback to file
   */
  async saveFeedback(feedback) {
    await fs.mkdir(this.config.feedbackDir, { recursive: true });

    // Save with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `feedback-${timestamp}.json`;
    const filepath = path.join(this.config.feedbackDir, filename);

    await fs.writeFile(filepath, JSON.stringify(feedback, null, 2), 'utf-8');

    // Also save as "latest"
    const latestPath = path.join(this.config.feedbackDir, 'latest.json');
    await fs.writeFile(latestPath, JSON.stringify(feedback, null, 2), 'utf-8');

    // Generate markdown report
    const reportPath = path.join(this.config.feedbackDir, 'latest-report.md');
    await fs.writeFile(reportPath, this.generateMarkdownReport(feedback), 'utf-8');

    console.log(`📄 Feedback saved to: ${filepath}`);
    console.log(`📄 Latest feedback: ${latestPath}`);
    console.log(`📄 Report: ${reportPath}\n`);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(feedback) {
    const lines = [];

    lines.push('# Agent Feedback Report\n');
    lines.push(`**Timestamp**: ${feedback.timestamp}\n`);
    lines.push(`**Task**: ${feedback.taskName}\n`);
    lines.push(`**Result**: ${feedback.overallResult === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}\n`);
    lines.push('---\n');

    // Build section
    if (feedback.build) {
      lines.push('## 🔨 Build\n');
      lines.push(`Status: ${feedback.build.success ? '✅ Success' : '❌ Failed'}\n`);
      if (feedback.build.errors.length > 0) {
        lines.push('\n**Errors:**\n');
        feedback.build.errors.forEach(err => lines.push(`- ${err}\n`));
      }
      lines.push('\n');
    }

    // Tests section
    if (feedback.tests) {
      lines.push('## 🧪 Tests\n');
      lines.push(`**Summary**: ${feedback.tests.summary.passed}/${feedback.tests.summary.total} passed\n\n`);

      for (const [category, results] of Object.entries(feedback.tests.categories)) {
        lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`);
        if (results.status === 'SKIPPED') {
          lines.push(`Status: ⏭️ SKIPPED (${results.reason})\n\n`);
        } else {
          lines.push(`Status: ${results.status === 'PASSED' ? '✅' : '❌'} ${results.status}\n`);
          lines.push(`Tests: ${results.passed}/${results.total} passed\n\n`);

          if (results.tests) {
            results.tests.forEach(test => {
              const icon = test.passed ? '✅' : '❌';
              lines.push(`${icon} ${test.name}\n`);
              if (!test.passed && test.error) {
                lines.push(`   Error: ${test.error}\n`);
              }
              if (test.screenshot) {
                lines.push(`   Screenshot: ${test.screenshot}\n`);
              }
            });
            lines.push('\n');
          }
        }
      }
    }

    // Suggestions section
    if (feedback.suggestions && feedback.suggestions.length > 0) {
      lines.push('## 💡 Suggestions\n\n');
      feedback.suggestions.forEach((suggestion, i) => {
        lines.push(`### ${i + 1}. ${suggestion.category} - ${suggestion.priority}\n\n`);
        if (suggestion.issue) {
          lines.push(`**Issue**: ${suggestion.issue}\n\n`);
        }
        lines.push(`**Suggestion**: ${suggestion.suggestion}\n\n`);
        if (suggestion.screenshot) {
          lines.push(`**Screenshot**: ${suggestion.screenshot}\n\n`);
        }
      });
    }

    // Screenshots section
    if (feedback.screenshots && feedback.screenshots.failed.length > 0) {
      lines.push('## 📸 Failed Test Screenshots\n\n');
      feedback.screenshots.failed.forEach(screenshot => {
        lines.push(`- ${screenshot.filename} (${screenshot.path})\n`);
      });
      lines.push('\n');
    }

    lines.push('---\n');
    lines.push(`*Generated at ${feedback.timestamp}*\n`);

    return lines.join('');
  }

  /**
   * Get latest feedback
   */
  async getLatest() {
    try {
      const latestPath = path.join(this.config.feedbackDir, 'latest.json');
      const data = await fs.readFile(latestPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node feedback-collector.js <test-results.json>');
    process.exit(1);
  }

  const resultsPath = args[0];

  try {
    const testResults = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    
    const collector = new FeedbackCollector();
    const feedback = await collector.collect(testResults);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 FEEDBACK SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Overall: ${feedback.overallResult}`);
    console.log(`Duration: ${feedback.metadata.duration.formatted}`);
    console.log(`Suggestions: ${feedback.suggestions.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(feedback.overallResult === 'PASSED' ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  main();
}

module.exports = FeedbackCollector;

