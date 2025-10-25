# 🚀 Agent Feedback Environment - Quick Start

Get the AI agent feedback environment running in **5 minutes**.

## Prerequisites Checklist

- [ ] **Node.js 20+** installed (`node --version`)
- [ ] **Xcode** installed (for iOS simulators)
- [ ] **Firebase CLI** installed (`firebase --version`)
- [ ] **Appium 3.0+** installed globally
- [ ] **(Optional)** Anthropic API key for Claude AI visual checks

## Setup Steps

### 1. Install Appium (if not installed)

```bash
# Install Appium globally
npm install -g appium@latest

# Install XCUITest driver for iOS
appium driver install xcuitest

# Verify installation
appium driver list --installed
```

### 2. Install Project Dependencies

```bash
# Install all dependencies
npm install
```

### 3. (Optional) Set Up Claude AI

For intelligent visual validation:

```bash
# Add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
```

Get your API key from: https://console.anthropic.com/

**Cost**: ~$30-40/month for active development, or skip to use Appium-only tests (free).

### 4. Verify Simulators

```bash
# List available iOS simulators
xcrun simctl list devices

# Should see "iPhone 15" and "iPhone SE (3rd generation)"
# If not, open Xcode → Preferences → Components → Download simulators
```

## Running the Agent

### Method 1: Run Sample Test (Recommended First Time)

This tests the infrastructure without making code changes.

```bash
# Terminal 1: Start Appium server
npm run appium:server

# Terminal 2: Run agent on sample spec
npm run agent:orchestrate -- --spec specs/000-agent-system-test/spec.md
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║                 AGENT ORCHESTRATOR                        ║
║          Automated Feature Development Loop               ║
╚═══════════════════════════════════════════════════════════╝

📄 Step 1: Loading specification...
✅ Loaded spec: Sample Test Feature

📋 Step 2: Parsing tasks...
✅ Found 1 task(s)

🚀 Step 3: Setting up environment...
📦 Step 1: Starting Firebase emulators...
✅ Firebase emulators running

📱 Step 2: Booting iOS simulators...
  Booting iPhone 15...
  ✅ iPhone 15 booted (...)
  Booting iPhone SE (3rd generation)...
  ✅ iPhone SE (3rd generation) booted (...)

... (environment setup continues)

🧪 Running tests for: Test Agent Environment Setup

⚡ Step 1: Running fast Appium tests...
  Running: App launches successfully...
  ✅ App launches successfully
✅ Fast tests: 2/2 passed

👁️  Step 2: Running visual validation with Claude...
  (or skipped if ANTHROPIC_API_KEY not set)

📊 Step 4: Collecting feedback...
✅ Feedback collected successfully

✅ All tests passed!

═══════════════════════════════════════════════════════════
✅ TESTS PASSED
═══════════════════════════════════════════════════════════
```

### Method 2: Develop a New Feature

1. **Create a spec file**:

```bash
# Copy template
cp specs/TEMPLATE.md specs/006-my-new-feature/spec.md

# Edit the spec
# Define tasks, tests, and acceptance criteria
```

2. **Run the agent**:

```bash
# Terminal 1: Start Appium
npm run appium:server

# Terminal 2: Run agent
npm run agent:orchestrate -- --spec specs/006-my-new-feature/spec.md
```

3. **Agent workflow**:
   - Parses your spec
   - For each task:
     - Generates/refines code (manual or via Cursor)
     - Builds the app
     - Runs tests (Appium + Claude)
     - Collects feedback
     - Iterates if tests fail
     - Creates PR if tests pass

### Method 3: Run Specific Task Only

```bash
# Run just task T002 from a spec
npm run agent:orchestrate -- --spec specs/005-feature/spec.md --task T002
```

## Controlling the Agent

### Environment Variables

Create a `.env` file to configure behavior:

```bash
# Claude AI visual checks (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Agent behavior
AUTO_CREATE_PR=true          # Auto-create PRs when tests pass
AUTO_CONTINUE=true           # Continue to next task if one fails
MAX_ATTEMPTS=3               # Max retry attempts per task
ENABLE_VISUAL_CHECKS=true    # Enable Claude AI (if API key set)
```

### Manual Control Commands

```bash
# Start environment manually (useful for debugging)
npm run agent:env:start

# Check environment status
npm run agent:env:status

# Stop environment
npm run agent:env:stop

# Run tests only (assumes environment running)
npm run agent:test -- --spec path/to/spec.json

# Collect feedback from results
npm run agent:feedback test-results/latest-results.json
```

## Understanding Results

### Feedback Files

After each run, check:

```bash
# Latest feedback (JSON)
cat feedback/agent/latest.json

# Human-readable report
cat feedback/agent/latest-report.md

# Screenshots
open test-results/agent-feedback/
```

### Test Results

```
feedback/agent/
├── latest.json              # Full feedback data
├── latest-report.md         # Markdown report
└── feedback-2025-...json    # Timestamped backups

test-results/agent-feedback/
├── screenshot-1.png
├── screenshot-2.png
└── failed-test-3.png
```

### Success/Failure

**If tests pass:**
- ✅ Feedback shows "PASSED"
- PR branch created (if AUTO_CREATE_PR=true)
- Agent moves to next task

**If tests fail:**
- ❌ Feedback shows "FAILED"
- Screenshots captured
- Suggestions generated
- Agent retries (up to MAX_ATTEMPTS)

## Common Issues

### Issue: "Firebase emulators failed to start"

**Solution:**
```bash
# Kill existing Firebase processes
pkill -f firebase

# Check if ports are in use
lsof -i :8080
lsof -i :5001

# Kill processes using those ports
kill -9 <PID>

# Retry
npm run agent:env:start
```

### Issue: "Simulator not found"

**Solution:**
```bash
# List available simulators
xcrun simctl list devices

# If iPhone 15 or iPhone SE missing:
# Open Xcode → Window → Devices and Simulators → Add

# Or download via Xcode preferences
```

### Issue: "Appium connection failed"

**Solution:**
```bash
# Verify Appium is running
ps aux | grep appium

# Start if not running
npm run appium:server

# Check port 4723 is available
lsof -i :4723
```

### Issue: "Element not found" in tests

**Solution:**
- Add `testID` prop to React Native components:
  ```tsx
  <TouchableOpacity testID="my-button">
  ```
- Check element is visible (not hidden)
- Increase wait time in test steps

### Issue: "Claude AI not working"

**Solution:**
```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Or check .env file
cat .env | grep ANTHROPIC

# If not set, tests will skip visual checks (expected)
```

## Next Steps

### 1. Explore the Code

```bash
scripts/agent/
├── environment-manager.js   # Manages test environment
├── hybrid-test-runner.js    # Runs Appium + Claude tests
├── feedback-collector.js    # Collects results
├── agent-orchestrator.js    # Main control loop
└── README.md                # Full documentation
```

### 2. Read Full Documentation

```bash
# Comprehensive guide
cat scripts/agent/README.md

# Spec template
cat specs/TEMPLATE.md

# Sample spec
cat specs/000-agent-system-test/spec.md
```

### 3. Create Your First Feature

1. Copy `specs/TEMPLATE.md` to `specs/007-my-feature/spec.md`
2. Define tasks with test criteria
3. Run: `npm run agent:orchestrate -- --spec specs/007-my-feature/spec.md`
4. Watch the magic happen! ✨

### 4. Integrate with Your Workflow

- **Manual code generation**: Write code, agent tests it
- **Cursor integration**: Let Cursor generate, agent validates
- **CI/CD**: Run agent in GitHub Actions on every commit

## Tips

**Tip 1**: Start with Appium-only tests (free) before enabling Claude AI.

**Tip 2**: Use `--task T001` flag to test one task at a time while developing.

**Tip 3**: Keep Appium server running in a dedicated terminal to avoid restarts.

**Tip 4**: Check `feedback/agent/latest-report.md` for human-readable results.

**Tip 5**: Screenshots are gold – always check them when tests fail.

## Cost Optimization

### Free Tier (Appium Only)

```bash
# Disable Claude AI
echo "ENABLE_VISUAL_CHECKS=false" >> .env
```

- Runs only Appium tests
- 100% free
- Fast execution
- Good for basic functional testing

### Paid Tier (Appium + Claude AI)

```bash
# Enable Claude AI
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
echo "ENABLE_VISUAL_CHECKS=true" >> .env
```

- Adds visual validation
- ~$30-40/month
- Slower but smarter
- Detects visual regressions
- Self-healing tests

**Recommendation**: Start free, add Claude AI for complex UI features.

## Support

- **Questions**: Open an issue in the repo
- **Bugs**: Report with logs from `feedback/agent/`
- **Documentation**: See `scripts/agent/README.md`
- **Examples**: Check `specs/000-agent-system-test/`

---

**Ready to let the AI work for you?** 🤖

Run this now:
```bash
npm run appium:server &
npm run agent:orchestrate -- --spec specs/000-agent-system-test/spec.md
```

**Watch your automated feedback loop in action!** ✨

