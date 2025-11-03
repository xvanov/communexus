#!/usr/bin/env node

/**
 * Agent Orchestrator
 *
 * Main control loop for the AI agent development workflow:
 * 1. Read specification document
 * 2. Parse tasks (each task = one PR)
 * 3. For each task:
 *    a. Generate/refine code
 *    b. Build app
 *    c. Run tests (hybrid: Appium + Claude)
 *    d. Collect feedback
 *    e. If tests fail → iterate with feedback
 *    f. If tests pass → create PR
 * 4. Move to next task
 *
 * Usage:
 *   node scripts/agent/agent-orchestrator.js --spec specs/005-new-feature/spec.md
 *   node scripts/agent/agent-orchestrator.js --spec specs/005-new-feature/spec.md --task T001
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const EnvironmentManager = require('./environment-manager');
const HybridTestRunner = require('./hybrid-test-runner');
const FeedbackCollector = require('./feedback-collector');

const execAsync = promisify(exec);

class AgentOrchestrator {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      maxAttempts: config.maxAttempts || 3,
      autoCreatePR: config.autoCreatePR !== false,
      autoContinue: config.autoContinue !== false,
      ...config,
    };

    this.environmentManager = new EnvironmentManager();
    this.feedbackCollector = new FeedbackCollector();

    this.currentTask = null;
    this.environment = null;
    this.sessionState = {
      startTime: Date.now(),
      tasksCompleted: 0,
      tasksFailed: 0,
      totalAttempts: 0,
    };
  }

  /**
   * Main orchestration loop
   */
  async run(specPath, specificTask = null) {
    console.log(
      '╔═══════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║                 AGENT ORCHESTRATOR                        ║'
    );
    console.log(
      '║          Automated Feature Development Loop               ║'
    );
    console.log(
      '╚═══════════════════════════════════════════════════════════╝\n'
    );

    try {
      // 1. Load specification
      console.log('📄 Step 1: Loading specification...');
      const spec = await this.loadSpecification(specPath);
      console.log(`✅ Loaded spec: ${spec.name || 'Unnamed Spec'}\n`);

      // 2. Parse tasks
      console.log('📋 Step 2: Parsing tasks...');
      const tasks = await this.parseTasks(spec);
      console.log(`✅ Found ${tasks.length} task(s)\n`);

      // Filter to specific task if requested
      const tasksToRun = specificTask
        ? tasks.filter(t => t.id === specificTask)
        : tasks;

      if (tasksToRun.length === 0) {
        throw new Error(`Task ${specificTask} not found in spec`);
      }

      // 3. Setup environment (once for all tasks)
      console.log('🚀 Step 3: Setting up environment...');
      this.environment = await this.environmentManager.start();
      console.log('✅ Environment ready\n');

      // 4. Process each task
      const results = [];
      for (let i = 0; i < tasksToRun.length; i++) {
        const task = tasksToRun[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(
          `📝 Task ${i + 1}/${tasksToRun.length}: ${task.id} - ${task.name}`
        );
        console.log('='.repeat(60) + '\n');

        const result = await this.processTask(task, spec);
        results.push(result);

        if (!result.success) {
          console.log(
            `\n❌ Task ${task.id} failed after ${result.attempts} attempt(s)`
          );

          if (!this.config.autoContinue) {
            console.log('⏸️  Stopping (autoContinue=false)');
            break;
          }

          console.log('⏭️  Continuing to next task (autoContinue=true)');
        } else {
          console.log(`\n✅ Task ${task.id} completed successfully!`);
        }
      }

      // 5. Print session summary
      await this.printSessionSummary(results);

      // 6. Cleanup
      console.log('\n🧹 Cleaning up environment...');
      await this.environmentManager.stop();
      console.log('✅ Cleanup complete\n');

      return {
        success: results.every(r => r.success),
        results,
      };
    } catch (error) {
      console.error('\n❌ Orchestrator failed:', error.message);

      // Cleanup on error
      if (this.environment) {
        await this.environmentManager.stop();
      }

      throw error;
    }
  }

  /**
   * Process a single task
   */
  async processTask(task, spec) {
    this.currentTask = task;
    const taskResult = {
      taskId: task.id,
      taskName: task.name,
      success: false,
      attempts: 0,
      feedback: [],
      finalFeedback: null,
    };

    let previousFeedback = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      taskResult.attempts = attempt;
      this.sessionState.totalAttempts++;

      console.log(`\n🔄 Attempt ${attempt}/${this.config.maxAttempts}\n`);

      try {
        // Step 1: Generate/refine code
        console.log('💻 Step 1: Generating code...');
        const codeGenResult = await this.generateCode(task, previousFeedback);

        if (!codeGenResult.success) {
          console.log('❌ Code generation failed:', codeGenResult.error);
          previousFeedback = {
            type: 'code_gen_error',
            error: codeGenResult.error,
          };
          continue;
        }
        console.log('✅ Code generated\n');

        // Step 2: Build app
        console.log('🔨 Step 2: Building app...');
        const buildResult = await this.buildApp();

        if (!buildResult.success) {
          console.log('❌ Build failed');
          previousFeedback = await this.feedbackCollector.collect(
            { taskName: task.name, passed: false, details: {} },
            buildResult
          );
          taskResult.feedback.push(previousFeedback);
          continue;
        }
        console.log('✅ Build successful\n');

        // Step 3: Run tests
        console.log('🧪 Step 3: Running tests...');
        const testRunner = new HybridTestRunner(this.environment);
        const testResults = await testRunner.runTests(task);

        // Step 4: Collect feedback
        console.log('\n📊 Step 4: Collecting feedback...');
        const feedback = await this.feedbackCollector.collect(
          testResults,
          buildResult
        );
        taskResult.feedback.push(feedback);
        taskResult.finalFeedback = feedback;

        // Check if tests passed
        if (testResults.passed) {
          console.log('✅ All tests passed!\n');
          taskResult.success = true;

          // Create PR if configured
          if (this.config.autoCreatePR) {
            await this.createPR(task, feedback);
          }

          this.sessionState.tasksCompleted++;
          return taskResult;
        }

        // Tests failed, prepare feedback for next iteration
        console.log('❌ Tests failed\n');
        previousFeedback = feedback;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} error:`, error.message);
        previousFeedback = {
          type: 'system_error',
          error: error.message,
          stack: error.stack,
        };
      }

      // Wait before retry
      if (attempt < this.config.maxAttempts) {
        console.log(`⏳ Waiting before retry...\n`);
        await this.wait(2000);
      }
    }

    // Failed after max attempts
    console.log(`\n❌ Task failed after ${this.config.maxAttempts} attempts`);
    this.sessionState.tasksFailed++;
    return taskResult;
  }

  /**
   * Load specification from file
   */
  async loadSpecification(specPath) {
    const content = await fs.readFile(specPath, 'utf-8');

    // If it's a markdown file, parse it
    if (specPath.endsWith('.md')) {
      return this.parseMarkdownSpec(content, specPath);
    }

    // If it's JSON, parse directly
    if (specPath.endsWith('.json')) {
      return JSON.parse(content);
    }

    throw new Error('Spec must be .md or .json file');
  }

  /**
   * Parse markdown specification into structured format
   */
  parseMarkdownSpec(content, specPath) {
    const spec = {
      path: specPath,
      name: '',
      description: '',
      tasks: [],
    };

    // Extract title
    const titleMatch = content.match(/# (.+)/);
    if (titleMatch) {
      spec.name = titleMatch[1];
    }

    // Extract tasks
    const taskRegex = /### (T\d+):([^\n]+)\n([\s\S]*?)(?=###|$)/g;
    let match;

    while ((match = taskRegex.exec(content)) !== null) {
      const [, taskId, taskName, taskContent] = match;

      const task = {
        id: taskId.trim(),
        name: taskName.trim(),
        description: this.extractDescription(taskContent),
        appiumTests: this.extractAppiumTests(taskContent),
        visualChecks: this.extractVisualChecks(taskContent),
        multiDeviceTests: this.extractMultiDeviceTests(taskContent),
        acceptanceCriteria: this.extractAcceptanceCriteria(taskContent),
      };

      spec.tasks.push(task);
    }

    return spec;
  }

  /**
   * Extract description from task content
   */
  extractDescription(content) {
    const match = content.match(/\*\*Description\*\*:([^\n]+)/);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract Appium test configurations
   */
  extractAppiumTests(content) {
    const match = content.match(
      /\*\*Appium Tests\*\*:\n([\s\S]*?)(?=\n\*\*|$)/
    );
    if (!match) return [];

    const tests = [];
    const lines = match[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'));

    for (const line of lines) {
      const testName = line.replace(/^-\s*/, '').trim();
      tests.push({
        name: testName,
        steps: [], // Will be populated by code generator
        assertions: [],
      });
    }

    return tests;
  }

  /**
   * Extract visual check configurations
   */
  extractVisualChecks(content) {
    const match = content.match(
      /\*\*Visual Checks\*\*.*?:\n([\s\S]*?)(?=\n\*\*|$)/
    );
    if (!match) return [];

    const checks = [];
    const lines = match[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'));

    for (const line of lines) {
      const question = line.replace(/^-\s*["']|["']$/g, '').trim();
      checks.push({
        description: question,
        question: question,
        expectedAnswer: 'yes',
      });
    }

    return checks;
  }

  /**
   * Extract multi-device test configurations
   */
  extractMultiDeviceTests(content) {
    const match = content.match(/\*\*Multi-Device\*\*:([^\n]+)/i);
    if (!match || match[1].toLowerCase().includes('no')) {
      return [];
    }

    // Default multi-device messaging test
    return [
      {
        name: 'Real-time message delivery',
        aliceSteps: [],
        bobSteps: [],
        bobVisualCheck: {
          question: 'Does Bob see the message from Alice?',
          expectedAnswer: 'yes',
        },
        syncDelay: 2000,
      },
    ];
  }

  /**
   * Extract acceptance criteria
   */
  extractAcceptanceCriteria(content) {
    const match = content.match(
      /\*\*Acceptance Criteria\*\*:\n([\s\S]*?)(?=\n###|$)/
    );
    if (!match) return [];

    const criteria = [];
    const lines = match[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'));

    for (const line of lines) {
      criteria.push(line.replace(/^-\s*\[\s*\]\s*/, '').trim());
    }

    return criteria;
  }

  /**
   * Parse tasks from spec
   */
  async parseTasks(spec) {
    // spec parameter is used implicitly through this.spec if needed
    return spec.tasks || [];
  }

  /**
   * Generate code for a task
   * This is where you'd interface with Cursor or other code generation tools
   */
  async generateCode(task, feedback = null) {
    console.log(`  Generating code for: ${task.name}`);

    // Save feedback for the agent to read
    if (feedback) {
      const feedbackPath = path.join(
        this.config.projectRoot,
        'feedback/agent/current-feedback.json'
      );
      await fs.mkdir(path.dirname(feedbackPath), { recursive: true });
      await fs.writeFile(
        feedbackPath,
        JSON.stringify(feedback, null, 2),
        'utf-8'
      );
      console.log(`  📝 Feedback saved for agent: ${feedbackPath}`);
    }

    // For now, we'll assume code is generated externally (e.g., by Cursor/Claude)
    // In a full implementation, this would:
    // 1. Call Cursor API or use Claude to generate code
    // 2. Write files to the project
    // 3. Return success/failure

    // Placeholder: Assume code is already written
    console.log(
      `  ℹ️  Assuming code is already written (manual or via Cursor)`
    );

    return {
      success: true,
      files: [],
    };
  }

  /**
   * Build the app
   */
  async buildApp() {
    console.log('  Building iOS app...');

    try {
      const { stdout, stderr } = await execAsync('npm run type-check', {
        cwd: this.config.projectRoot,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        success: true,
        exitCode: 0,
        output: stdout + stderr,
      };
    } catch (error) {
      return {
        success: false,
        exitCode: error.code || 1,
        output: error.stdout + error.stderr,
        error: error.message,
      };
    }
  }

  /**
   * Create a pull request
   */
  async createPR(task, feedback) {
    console.log('\n📤 Creating pull request...');

    try {
      // Create branch
      const branchName = `agent/${task.id.toLowerCase()}-${task.name.toLowerCase().replace(/\s+/g, '-')}`;

      await execAsync(`git checkout -b ${branchName}`);
      await execAsync('git add .');
      await execAsync(
        `git commit -m "feat(${task.id}): ${task.name}\n\nAuto-generated by Agent Orchestrator\n\nAll tests passed:\n${feedback.tests.summary.passed}/${feedback.tests.summary.total} tests passing"`
      );

      console.log(`✅ Created branch: ${branchName}`);
      console.log(`✅ Committed changes`);
      console.log(`\n💡 To push and create PR:`);
      console.log(`   git push origin ${branchName}`);
      console.log(
        `   gh pr create --title "${task.id}: ${task.name}" --body "Auto-generated by Agent Orchestrator"`
      );
    } catch (error) {
      console.error('❌ Failed to create PR:', error.message);
    }
  }

  /**
   * Print session summary
   */
  async printSessionSummary(results) {
    const duration = (
      (Date.now() - this.sessionState.startTime) /
      1000 /
      60
    ).toFixed(1);

    console.log(
      '\n\n╔═══════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║                   SESSION SUMMARY                         ║'
    );
    console.log(
      '╚═══════════════════════════════════════════════════════════╝\n'
    );

    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`📝 Tasks Processed: ${results.length}`);
    console.log(`✅ Tasks Completed: ${this.sessionState.tasksCompleted}`);
    console.log(`❌ Tasks Failed: ${this.sessionState.tasksFailed}`);
    console.log(`🔄 Total Attempts: ${this.sessionState.totalAttempts}`);
    console.log('');

    // Task details
    console.log('📋 Task Results:\n');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(
        `   ${status} ${result.taskId}: ${result.taskName} (${result.attempts} attempts)`
      );
    });

    console.log('');
  }

  /**
   * Wait utility
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const specIndex = args.indexOf('--spec');
  const taskIndex = args.indexOf('--task');

  if (specIndex === -1 || !args[specIndex + 1]) {
    console.error(
      'Usage: node agent-orchestrator.js --spec path/to/spec.md [--task T001]'
    );
    console.error('\nOptions:');
    console.error('  --spec    Path to specification file (.md or .json)');
    console.error('  --task    (Optional) Run specific task only');
    process.exit(1);
  }

  const specPath = args[specIndex + 1];
  const specificTask = taskIndex !== -1 ? args[taskIndex + 1] : null;

  try {
    const orchestrator = new AgentOrchestrator({
      autoCreatePR: process.env.AUTO_CREATE_PR !== 'false',
      autoContinue: process.env.AUTO_CONTINUE !== 'false',
    });

    const result = await orchestrator.run(specPath, specificTask);

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  main();
}

module.exports = AgentOrchestrator;
