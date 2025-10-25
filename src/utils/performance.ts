import { Platform } from 'react-native';

export interface PerformanceMetrics {
  appLaunchTime: number;
  messageDeliveryTime: number;
  aiResponseTime: number;
  scrollFPS: number;
  memoryUsage: number;
  batteryUsage: number;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  sampleRate: number;
  maxSamples: number;
  thresholds: {
    appLaunch: number; // milliseconds
    messageDelivery: number; // milliseconds
    aiResponse: number; // milliseconds
    scrollFPS: number; // frames per second
    memoryUsage: number; // MB
    batteryUsage: number; // percentage per hour
  };
}

const defaultConfig: PerformanceConfig = {
  enableMonitoring: true,
  sampleRate: 0.1, // 10% of operations
  maxSamples: 1000,
  thresholds: {
    appLaunch: 2000, // 2 seconds
    messageDelivery: 200, // 200ms
    aiResponse: 2000, // 2 seconds
    scrollFPS: 60, // 60 FPS
    memoryUsage: 100, // 100MB
    batteryUsage: 5, // 5% per hour
  },
};

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private startTimes: Map<string, number> = new Map();

  constructor(config: PerformanceConfig = defaultConfig) {
    this.config = config;
  }

  // Start timing an operation
  startTiming(operation: string): void {
    if (!this.config.enableMonitoring) return;

    this.startTimes.set(operation, Date.now());
  }

  // End timing an operation and record the metric
  endTiming(operation: string, value?: number): number {
    if (!this.config.enableMonitoring) return 0;

    const startTime = this.startTimes.get(operation);
    if (!startTime) return 0;

    const duration = value || Date.now() - startTime;
    this.startTimes.delete(operation);

    // Only record if we're within sample rate
    if (Math.random() < this.config.sampleRate) {
      this.recordMetric(operation, duration);
    }

    return duration;
  }

  // Record a specific metric
  recordMetric(operation: string, value: number): void {
    if (!this.config.enableMonitoring) return;

    const metric: Partial<PerformanceMetrics> = {};

    switch (operation) {
      case 'appLaunch':
        metric.appLaunchTime = value;
        break;
      case 'messageDelivery':
        metric.messageDeliveryTime = value;
        break;
      case 'aiResponse':
        metric.aiResponseTime = value;
        break;
      case 'scrollFPS':
        metric.scrollFPS = value;
        break;
      case 'memoryUsage':
        metric.memoryUsage = value;
        break;
      case 'batteryUsage':
        metric.batteryUsage = value;
        break;
    }

    this.metrics.push(metric as PerformanceMetrics);

    // Keep only the most recent samples
    if (this.metrics.length > this.config.maxSamples) {
      this.metrics = this.metrics.slice(-this.config.maxSamples);
    }
  }

  // Get performance statistics
  getStats(): {
    average: Partial<PerformanceMetrics>;
    max: Partial<PerformanceMetrics>;
    min: Partial<PerformanceMetrics>;
    violations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        average: {},
        max: {},
        min: {},
        violations: [],
      };
    }

    const stats = {
      average: {} as Partial<PerformanceMetrics>,
      max: {} as Partial<PerformanceMetrics>,
      min: {} as Partial<PerformanceMetrics>,
      violations: [] as string[],
    };

    const keys: (keyof PerformanceMetrics)[] = [
      'appLaunchTime',
      'messageDeliveryTime',
      'aiResponseTime',
      'scrollFPS',
      'memoryUsage',
      'batteryUsage',
    ];

    keys.forEach(key => {
      const values = this.metrics
        .map(m => m[key])
        .filter(v => v !== undefined) as number[];

      if (values.length > 0) {
        stats.average[key] = values.reduce((a, b) => a + b, 0) / values.length;
        stats.max[key] = Math.max(...values);
        stats.min[key] = Math.min(...values);

        // Check for threshold violations
        const threshold =
          this.config.thresholds[key as keyof typeof this.config.thresholds];
        if (threshold && stats.average[key]! > threshold) {
          stats.violations.push(
            `${key} average (${stats.average[key]}) exceeds threshold (${threshold})`
          );
        }
      }
    });

    return stats;
  }

  // Check if performance is within acceptable limits
  isPerformanceAcceptable(): boolean {
    const stats = this.getStats();
    return stats.violations.length === 0;
  }

  // Get performance report
  getReport(): string {
    const stats = this.getStats();
    const isAcceptable = this.isPerformanceAcceptable();

    let report = `Performance Report\n`;
    report += `==================\n`;
    report += `Status: ${isAcceptable ? '✅ ACCEPTABLE' : '❌ NEEDS ATTENTION'}\n`;
    report += `Samples: ${this.metrics.length}\n\n`;

    if (stats.violations.length > 0) {
      report += `Violations:\n`;
      stats.violations.forEach(violation => {
        report += `  ❌ ${violation}\n`;
      });
      report += `\n`;
    }

    report += `Metrics:\n`;
    Object.entries(stats.average).forEach(([key, value]) => {
      if (value !== undefined) {
        const threshold =
          this.config.thresholds[key as keyof typeof this.config.thresholds];
        const status = threshold && value > threshold ? '❌' : '✅';
        report += `  ${status} ${key}: ${value.toFixed(2)} (threshold: ${threshold})\n`;
      }
    });

    return report;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  // Update configuration
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const measureAppLaunch = (): (() => void) => {
  performanceMonitor.startTiming('appLaunch');
  return () => performanceMonitor.endTiming('appLaunch');
};

export const measureMessageDelivery = (): (() => void) => {
  performanceMonitor.startTiming('messageDelivery');
  return () => performanceMonitor.endTiming('messageDelivery');
};

export const measureAIResponse = (): (() => void) => {
  performanceMonitor.startTiming('aiResponse');
  return () => performanceMonitor.endTiming('aiResponse');
};

export const measureScrollFPS = (fps: number): void => {
  performanceMonitor.recordMetric('scrollFPS', fps);
};

export const measureMemoryUsage = (): void => {
  if (Platform.OS === 'web') {
    // Browser memory usage
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      performanceMonitor.recordMetric('memoryUsage', usedMB);
    }
  }
  // Native memory monitoring would require additional native modules
};

export const measureBatteryUsage = (): void => {
  // Battery monitoring would require additional native modules
  // This is a placeholder for future implementation
};

// Performance optimization utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
};

// Export default config for external use
export { defaultConfig };
