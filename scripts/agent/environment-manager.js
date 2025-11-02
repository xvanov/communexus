#!/usr/bin/env node

/**
 * Environment Manager
 * 
 * Orchestrates the complete test environment:
 * - Firebase emulators (Firestore, Auth, Storage, Functions)
 * - iOS Simulators (2 for multi-device messaging tests)
 * - App building and installation
 * - Health checks and monitoring
 * 
 * Usage:
 *   node scripts/agent/environment-manager.js start
 *   node scripts/agent/environment-manager.js stop
 *   node scripts/agent/environment-manager.js status
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class EnvironmentManager {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      firebaseProject: config.firebaseProject || 'demo-communexus',
      simulators: config.simulators || [
        { name: 'iPhone 15', role: 'alice', email: 'alice@demo.com' },
        { name: 'iPhone SE (3rd generation)', role: 'bob', email: 'bob@demo.com' }
      ],
      appBundleId: config.appBundleId || 'com.communexus.communexus',
      firebasePorts: {
        firestore: 8080,
        auth: 9099,
        storage: 9199,
        functions: 5001,
        ui: 4000
      },
      ...config
    };

    this.processes = {
      firebase: null,
      appium: null
    };

    this.simulatorData = [];
    this.stateFile = path.join(this.config.projectRoot, '.agent-env-state.json');
  }

  /**
   * Start the complete environment
   */
  async start() {
    console.log('🚀 Starting Agent Feedback Environment...\n');

    try {
      // 1. Start Firebase emulators
      console.log('📦 Step 1: Starting Firebase emulators...');
      await this.startFirebase();
      console.log('✅ Firebase emulators running\n');

      // 2. Boot iOS simulators
      console.log('📱 Step 2: Booting iOS simulators...');
      await this.bootSimulators();
      console.log('✅ iOS simulators booted\n');

      // 3. Check if app needs building
      console.log('🔨 Step 3: Checking app build...');
      const needsBuild = await this.checkAppBuild();
      if (needsBuild) {
        console.log('⏳ Building app (this takes ~2-3 minutes)...');
        await this.buildApp();
        console.log('✅ App built successfully\n');
      } else {
        console.log('✅ App already built\n');
      }

      // 4. Install app on simulators
      console.log('📲 Step 4: Installing app on simulators...');
      await this.installApp();
      console.log('✅ App installed on all simulators\n');

      // 5. Wait for environment to be ready
      console.log('⏳ Step 5: Waiting for environment to be ready...');
      await this.waitForReady();
      console.log('✅ Environment ready!\n');

      // 6. Save state
      await this.saveState();

      // 7. Print summary
      this.printEnvironmentInfo();

      return {
        success: true,
        environment: this.getEnvironmentInfo()
      };
    } catch (error) {
      console.error('❌ Failed to start environment:', error.message);
      await this.stop(); // Clean up on failure
      throw error;
    }
  }

  /**
   * Stop the complete environment
   */
  async stop() {
    console.log('🛑 Stopping Agent Feedback Environment...\n');

    // Stop Firebase emulators
    if (this.processes.firebase) {
      console.log('⏹️  Stopping Firebase emulators...');
      this.processes.firebase.kill('SIGTERM');
      this.processes.firebase = null;
    }

    // Shutdown simulators
    console.log('⏹️  Shutting down iOS simulators...');
    for (const sim of this.simulatorData) {
      try {
        await execAsync(`xcrun simctl shutdown "${sim.udid}"`);
      } catch (error) {
        // Already shutdown, ignore
      }
    }

    // Clean up state file
    try {
      await fs.unlink(this.stateFile);
    } catch (error) {
      // File doesn't exist, ignore
    }

    console.log('✅ Environment stopped\n');
  }

  /**
   * Get environment status
   */
  async status() {
    console.log('📊 Environment Status\n');

    try {
      const state = await this.loadState();
      if (!state) {
        console.log('❌ Environment not running\n');
        return { running: false };
      }

      // Check Firebase
      const firebaseRunning = await this.isFirebaseRunning();
      console.log(`Firebase: ${firebaseRunning ? '✅ Running' : '❌ Not running'}`);

      // Check simulators
      for (const sim of state.simulators) {
        const running = await this.isSimulatorRunning(sim.udid);
        console.log(`${sim.name} (${sim.role}): ${running ? '✅ Running' : '❌ Not running'}`);
      }

      console.log('');
      return {
        running: firebaseRunning && state.simulators.every(s => this.isSimulatorRunning(s.udid)),
        details: state
      };
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      return { running: false, error: error.message };
    }
  }

  /**
   * Start Firebase emulators
   */
  async startFirebase() {
    return new Promise((resolve, reject) => {
      const firebase = spawn(
        'npx',
        [
          'firebase',
          'emulators:start',
          '--only',
          'firestore,auth,storage,functions',
          '--project',
          this.config.firebaseProject
        ],
        {
          cwd: this.config.projectRoot,
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          reject(new Error('Firebase emulators failed to start within 30 seconds'));
        }
      }, 30000);

      firebase.stdout.on('data', (data) => {
        const output = data.toString();
        // Look for "All emulators ready"
        if (output.includes('All emulators ready') || output.includes('All emulators started')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      firebase.stderr.on('data', (data) => {
        const error = data.toString();
        // Only log errors, not warnings
        if (error.includes('Error:') || error.includes('ERROR')) {
          console.error('Firebase error:', error);
        }
      });

      firebase.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Firebase: ${error.message}`));
      });

      firebase.on('exit', (code) => {
        if (code !== 0 && !started) {
          clearTimeout(timeout);
          reject(new Error(`Firebase emulators exited with code ${code}`));
        }
      });

      this.processes.firebase = firebase;
    });
  }

  /**
   * Boot iOS simulators
   */
  async bootSimulators() {
    this.simulatorData = [];

    for (const simConfig of this.config.simulators) {
      console.log(`  Booting ${simConfig.name}...`);

      // Find simulator UDID
      const { stdout } = await execAsync('xcrun simctl list devices available --json');
      const devices = JSON.parse(stdout);

      let udid = null;
      for (const runtime in devices.devices) {
        const found = devices.devices[runtime].find(
          d => d.name === simConfig.name && d.isAvailable
        );
        if (found) {
          udid = found.udid;
          break;
        }
      }

      if (!udid) {
        throw new Error(`Simulator "${simConfig.name}" not found`);
      }

      // Boot simulator (ignore if already booted)
      try {
        await execAsync(`xcrun simctl boot "${udid}"`);
      } catch (error) {
        // Already booted, that's fine
        if (!error.message.includes('Booted')) {
          throw error;
        }
      }

      this.simulatorData.push({
        ...simConfig,
        udid
      });

      console.log(`  ✅ ${simConfig.name} booted (${udid})`);
    }
  }

  /**
   * Check if app needs building
   */
  async checkAppBuild() {
    // If SKIP_BUILD environment variable is set, skip the build
    if (process.env.SKIP_BUILD === 'true') {
      console.log('  ℹ️  Skipping build (SKIP_BUILD=true)');
      return false;
    }

    // Check if .app bundle exists in the build directory
    // This is more reliable than trying to check installed apps
    const buildDir = path.join(
      this.config.projectRoot,
      'ios/build/Build/Products/Debug-iphonesimulator'
    );
    
    try {
      const files = await fs.readdir(buildDir);
      const appBundle = files.find(f => f.endsWith('.app'));
      
      if (appBundle) {
        // Check how old the build is
        const appPath = path.join(buildDir, appBundle);
        const stats = await fs.stat(appPath);
        const age = Date.now() - stats.mtimeMs;
        const hoursOld = age / (1000 * 60 * 60);
        
        if (hoursOld < 24) {
          console.log(`  ✅ App bundle is ${hoursOld.toFixed(1)} hours old (recent enough)`);
          return false; // Build is recent
        } else {
          console.log(`  ⚠️  App bundle is ${hoursOld.toFixed(1)} hours old`);
          console.log('  💡 Set SKIP_BUILD=true to skip rebuilding');
          return true; // Build is old
        }
      }
    } catch (error) {
      // Build directory doesn't exist or can't read it
    }

    // No recent build found
    console.log('  ⚠️  No recent build found');
    console.log('  💡 Set SKIP_BUILD=true to skip building');
    return true;
  }

  /**
   * Build the app
   */
  async buildApp() {
    try {
      // Build for the first simulator
      const device = this.simulatorData[0].name;
      await execAsync(
        `npx expo run:ios --device "${device}"`,
        {
          cwd: this.config.projectRoot,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer for build output
        }
      );
    } catch (error) {
      throw new Error(`App build failed: ${error.message}`);
    }
  }

  /**
   * Install app on all simulators
   */
  async installApp() {
    // Find the .app bundle
    const buildPath = path.join(this.config.projectRoot, 'ios/build/Build/Products/Debug-iphonesimulator');
    const files = await fs.readdir(buildPath);
    const appBundle = files.find(f => f.endsWith('.app'));

    if (!appBundle) {
      throw new Error('Could not find .app bundle in build output');
    }

    const appPath = path.join(buildPath, appBundle);

    // Install on each simulator
    for (const sim of this.simulatorData) {
      console.log(`  Installing on ${sim.name}...`);
      await execAsync(`xcrun simctl install "${sim.udid}" "${appPath}"`);
      console.log(`  ✅ Installed on ${sim.name}`);
    }
  }

  /**
   * Wait for environment to be ready
   */
  async waitForReady() {
    // Wait for Firebase to be fully ready
    await this.wait(2000);

    // Check Firebase health
    const firebaseHealthy = await this.isFirebaseRunning();
    if (!firebaseHealthy) {
      throw new Error('Firebase emulators not responding');
    }

    // Launch app on each simulator
    for (const sim of this.simulatorData) {
      console.log(`  Launching app on ${sim.name}...`);
      await execAsync(`xcrun simctl launch "${sim.udid}" ${this.config.appBundleId}`);
      await this.wait(3000); // Wait for app to launch
    }
  }

  /**
   * Check if Firebase is running
   */
  async isFirebaseRunning() {
    try {
      const response = await fetch(`http://127.0.0.1:${this.config.firebasePorts.firestore}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if simulator is running
   */
  async isSimulatorRunning(udid) {
    try {
      const { stdout } = await execAsync('xcrun simctl list devices --json');
      const devices = JSON.parse(stdout);
      
      for (const runtime in devices.devices) {
        const device = devices.devices[runtime].find(d => d.udid === udid);
        if (device) {
          return device.state === 'Booted';
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    return {
      firebase: {
        firestore: `http://127.0.0.1:${this.config.firebasePorts.firestore}`,
        auth: `http://127.0.0.1:${this.config.firebasePorts.auth}`,
        storage: `http://127.0.0.1:${this.config.firebasePorts.storage}`,
        functions: `http://127.0.0.1:${this.config.firebasePorts.functions}`,
        ui: `http://127.0.0.1:${this.config.firebasePorts.ui}`
      },
      simulators: this.simulatorData,
      appBundleId: this.config.appBundleId
    };
  }

  /**
   * Print environment information
   */
  printEnvironmentInfo() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 AGENT FEEDBACK ENVIRONMENT READY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🔥 Firebase Emulators:');
    console.log(`   Firestore: http://127.0.0.1:${this.config.firebasePorts.firestore}`);
    console.log(`   Auth:      http://127.0.0.1:${this.config.firebasePorts.auth}`);
    console.log(`   Functions: http://127.0.0.1:${this.config.firebasePorts.functions}`);
    console.log(`   UI:        http://127.0.0.1:${this.config.firebasePorts.ui}\n`);

    console.log('📱 iOS Simulators:');
    this.simulatorData.forEach(sim => {
      console.log(`   ${sim.name} (${sim.role})`);
      console.log(`   └─ UDID: ${sim.udid}`);
      console.log(`   └─ User: ${sim.email}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════\n');
  }

  /**
   * Save environment state
   */
  async saveState() {
    const state = {
      timestamp: new Date().toISOString(),
      ...this.getEnvironmentInfo()
    };

    await fs.writeFile(
      this.stateFile,
      JSON.stringify(state, null, 2),
      'utf-8'
    );
  }

  /**
   * Load environment state
   */
  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
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
  const command = process.argv[2] || 'start';
  const manager = new EnvironmentManager();

  try {
    switch (command) {
      case 'start':
        await manager.start();
        console.log('✅ Environment started successfully!');
        console.log('💡 Keep this terminal open to maintain the environment.');
        console.log('💡 Press Ctrl+C to stop.\n');
        
        // Keep process alive
        process.on('SIGINT', async () => {
          console.log('\n\n🛑 Stopping environment...');
          await manager.stop();
          process.exit(0);
        });
        
        // Keep alive
        await new Promise(() => {});
        break;

      case 'stop':
        await manager.stop();
        process.exit(0);
        break;

      case 'status':
        await manager.status();
        process.exit(0);
        break;

      default:
        console.error('Unknown command. Use: start, stop, or status');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  main();
}

module.exports = EnvironmentManager;

