# 🤖 Agent Feedback Environment

Automated test feedback environment that enables AI agents to continuously develop features, test them, and iterate based on visual and functional feedback.

## Overview

This system creates a complete feedback loop where an AI agent can:

1. **Read specifications** - Parse markdown/JSON specs with tasks
2. **Generate code** - Write or refine features
3. **Build & test** - Compile and run automated tests
4. **Collect feedback** - Gather test results, screenshots, logs
5. **Iterate** - Use feedback to fix issues and retry
6. **Create PRs** - Automatically create pull requests when tests pass

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Orchestrator (Main Loop)                            │
│  - Reads specs → Generates code → Tests → Iterates         │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
┌──────────────────┐                ┌──────────────────┐
│ Environment      │                │ Hybrid Test      │
│ Manager          │                │ Runner           │
│                  │                │                  │
│ - Firebase       │                │ - Appium (Fast)  │
│ - 2x iOS Sims    │                │ - Claude (Smart) │
│ - App Build      │                │ - Screenshots    │
└──────────────────┘                └──────────────────┘
                            ↓
                ┌──────────────────────┐
                │ Feedback Collector   │
                │ - Test Results       │
                │ - Screenshots        │
                │ - Build Errors       │
                │ - Suggestions        │
                └──────────────────────┘
```

## Components

### 1. **Environment Manager** (`environment-manager.js`)

Orchestrates the complete test environment:

- Starts Firebase emulators (Firestore, Auth, Storage, Functions)
- Boots 2 iOS simulators (for multi-device messaging tests)
- Builds and installs the app
- Manages health checks and cleanup

**Usage:**
```bash
npm run agent:env:start    # Start environment
npm run agent:env:status   # Check status
npm run agent:env:stop     # Stop environment
```

### 2. **Hybrid Test Runner** (`hybrid-test-runner.js`)

Combines two testing approaches for optimal coverage:

- **Appium**: Fast, deterministic tests (30-60 seconds)
- **Claude AI**: Intelligent visual validation with screenshots

**Strategy:**
- Run Appium tests first (fast feedback)
- Run Claude AI visual checks if Appium passes
- Run multi-device tests for messaging features

**Usage:**
```bash
npm run agent:test -- --spec path/to/test-spec.json
```

### 3. **Feedback Collector** (`feedback-collector.js`)

Aggregates all feedback for the AI agent:

- Test results (pass/fail, duration, details)
- Build logs and errors
- Screenshots (especially for failures)
- System logs (Firebase, simulator)
- AI-generated suggestions for fixes

**Output:**
- JSON feedback file
- Markdown report
- Screenshots organized by test

### 4. **Agent Orchestrator** (`agent-orchestrator.js`)

Main control loop that coordinates everything:

- Parses specification documents
- Extracts tasks with test definitions
- Runs each task through the build-test-feedback loop
- Iterates up to N times on failures
- Creates PRs when tests pass

**Usage:**
```bash
# Run all tasks in a spec
npm run agent:orchestrate -- --spec specs/005-new-feature/spec.md

# Run specific task only
npm run agent:orchestrate -- --spec specs/005-new-feature/spec.md --task T001
```

## Quick Start

### Prerequisites

1. **Node.js 20+** - For running scripts
2. **Xcode** - For iOS simulators
3. **Firebase CLI** - For emulators
4. **Appium 3.0+** - For UI automation
5. **(Optional) Anthropic API Key** - For Claude AI visual checks

### Installation

```bash
# Install dependencies
npm install

# Install Appium globally
npm install -g appium@latest

# Install Appium drivers
appium driver install xcuitest

# Start Appium server (in separate terminal)
npm run appium:server
```

### Environment Variables

Create a `.env` file (optional):

```bash
# Required for Claude AI visual checks (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Agent configuration (optional, defaults shown)
AUTO_CREATE_PR=true          # Create PR automatically when tests pass
AUTO_CONTINUE=true           # Continue to next task if one fails
MAX_ATTEMPTS=3               # Maximum retry attempts per task
```

### Running the Agent

#### Step 1: Start Appium (separate terminal)

```bash
npm run appium:server
```

Keep this running while the agent works.

#### Step 2: Run the agent on a spec

```bash
npm run agent:orchestrate -- --spec specs/000-agent-system-test/spec.md
```

The agent will:
1. Start Firebase emulators
2. Boot iOS simulators
3. Build and install the app
4. Run tests for each task
5. Collect feedback
6. Iterate on failures
7. Create PRs on success
8. Clean up environment

## Writing Specifications

Specifications define what the agent should build and how to test it.

### Spec Format (Markdown)

```markdown
# Feature Name

## Tasks

### T001: Task Name

**Description**: What this task accomplishes

**Appium Tests**:
- test-feature-visible.js
- test-user-interaction.js

**Visual Checks** (Claude AI):
- "Is the button visible in the header?"
- "Does the modal open correctly?"

**Multi-Device**: Yes/No

**Acceptance Criteria**:
- [ ] Feature is visible
- [ ] Tests pass
- [ ] Performance is good
```

See `specs/TEMPLATE.md` for a complete template.

### Test Definitions

#### Appium Test Format

```json
{
  "name": "Test name",
  "steps": [
    { "action": "tap", "testID": "button-id" },
    { "action": "type", "testID": "input-id", "text": "Hello" },
    { "action": "wait", "duration": 2000 }
  ],
  "assertions": [
    { "type": "elementVisible", "testID": "result-id" },
    { "type": "elementText", "testID": "result-id", "expectedText": "Success" }
  ]
}
```

#### Visual Check Format

```json
{
  "description": "Friendly description",
  "question": "Does the UI look correct?",
  "expectedAnswer": "yes"
}
```

#### Multi-Device Test Format

```json
{
  "name": "Alice sends message to Bob",
  "aliceSteps": [
    { "action": "tap", "testID": "new-message" },
    { "action": "type", "testID": "message-input", "text": "Hello Bob!" },
    { "action": "tap", "testID": "send-button" }
  ],
  "bobSteps": [],
  "bobVisualCheck": {
    "question": "Does Bob see Alice's message 'Hello Bob!'?",
    "expectedAnswer": "yes"
  },
  "syncDelay": 2000
}
```

## Multi-Device Testing

The environment automatically boots **2 iOS simulators** for testing real-time messaging:

- **Simulator 1 (Alice)**: iPhone 15, user `alice@demo.com`
- **Simulator 2 (Bob)**: iPhone SE, user `bob@demo.com`

Tests can coordinate actions across both devices:

```javascript
// Alice sends message
await alice.tapOn('send-button');

// Wait for real-time sync
await wait(2000);

// Bob receives message
await bob.verifyMessageVisible('Hello from Alice!');
```

## Feedback Loop

After each test run, the feedback collector generates:

### 1. JSON Feedback (`feedback/agent/latest.json`)

```json
{
  "timestamp": "2025-10-25T...",
  "overallResult": "PASSED",
  "tests": {
    "summary": { "total": 5, "passed": 5, "failed": 0 },
    "categories": {
      "fast": { "passed": 3, "failed": 0 },
      "visual": { "passed": 2, "failed": 0 }
    }
  },
  "suggestions": [
    {
      "category": "SUCCESS",
      "suggestion": "All tests passed! Ready to create PR."
    }
  ]
}
```

### 2. Markdown Report (`feedback/agent/latest-report.md`)

Human-readable report with:
- Test summary
- Failed tests with errors
- Screenshots
- Suggestions for fixes

### 3. Screenshots (`test-results/agent-feedback/`)

- Timestamped screenshots for all tests
- Failure screenshots highlighted
- Multi-device screenshots (Alice + Bob)

## Cost Estimation

### With Claude AI Visual Checks

- **Claude Sonnet 4** pricing:
  - Input: $3 per million tokens
  - Output: $15 per million tokens
  - Images: ~1,500 tokens each

- **Typical test run**:
  - 5 visual checks × ~$0.01 = ~$0.05 per run
  - 20 runs/day during development = ~$1/day
  - **Monthly cost: ~$30-40**

### Without Claude AI

- **Free** (using only Appium tests)
- Visual validation requires manual checking

**Recommendation**: Enable Claude AI for complex UI features, disable for simple features.

## Configuration

### Disable Claude AI Visual Checks

```bash
# In spec.md, remove "Visual Checks" section
# Or set in .env:
ENABLE_VISUAL_CHECKS=false
```

### Adjust Retry Attempts

```bash
# In .env:
MAX_ATTEMPTS=5  # Default is 3
```

### Disable Auto PR Creation

```bash
# In .env:
AUTO_CREATE_PR=false
```

Then manually create PRs after reviewing results.

## Troubleshooting

### Environment won't start

```bash
# Check if Firebase emulators port is in use
lsof -i :8080

# Check if simulators are available
xcrun simctl list devices

# Try stopping and restarting
npm run agent:env:stop
npm run agent:env:start
```

### Appium connection failed

```bash
# Verify Appium is running
npm run appium:server

# Check Appium is on port 4723
lsof -i :4723
```

### Tests fail with "Element not found"

- Verify `testID` props are set on React Native components
- Check if element is visible (not hidden or off-screen)
- Increase wait time in test steps

### Claude AI not working

```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Or in .env file
cat .env | grep ANTHROPIC
```

### Build fails

```bash
# Run type check manually
npm run type-check

# Check for compilation errors
npm run lint
```

## Examples

### Example 1: Run Sample Test

```bash
# Terminal 1: Start Appium
npm run appium:server

# Terminal 2: Run agent
npm run agent:orchestrate -- --spec specs/000-agent-system-test/spec.md
```

Expected output:
- Environment starts (Firebase + 2 simulators)
- App builds and installs
- Tests run (Appium + Claude)
- Feedback collected
- Environment cleans up

### Example 2: Develop New Feature

1. **Create spec**: `specs/006-my-feature/spec.md`
2. **Define tasks** with test criteria
3. **Run agent**: `npm run agent:orchestrate -- --spec specs/006-my-feature/spec.md`
4. **Agent generates code** (manually or via Cursor)
5. **Agent tests automatically**
6. **Agent iterates on failures**
7. **Agent creates PR on success**

### Example 3: Test Specific Task

```bash
# Only run task T002
npm run agent:orchestrate -- --spec specs/005-feature/spec.md --task T002
```

## CI/CD Integration

The agent can run in CI/CD pipelines:

```yaml
# .github/workflows/agent-test.yml
name: Agent Test
on: [push]

jobs:
  agent-test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start Appium
        run: npm run appium:server &
      
      - name: Run agent
        run: npm run agent:orchestrate -- --spec specs/my-spec/spec.md
        env:
          AUTO_CREATE_PR: false  # Review before PR in CI
```

## Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Environment manager
- [x] Hybrid test runner
- [x] Feedback collector
- [x] Agent orchestrator
- [x] Test specification format

### Phase 2: Enhanced Testing
- [ ] Parallel test execution
- [ ] Performance metrics collection
- [ ] Video recording of test runs
- [ ] Test result comparison

### Phase 3: Intelligence
- [ ] AI-powered test generation from specs
- [ ] Automatic bug fix suggestions
- [ ] Learning from previous test runs
- [ ] Predictive failure detection

### Phase 4: Scaling
- [ ] Cloud device testing (BrowserStack, Sauce Labs)
- [ ] Android support
- [ ] Web browser testing
- [ ] Load testing integration

## Contributing

See main project `CONTRIBUTING.md` for guidelines.

## License

MIT - See LICENSE file.

---

**Built for continuous AI-driven development** 🤖✨

*Part of the Communexus project - AI-powered communication platform*

