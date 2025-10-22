// tests/integration/functions_exports.test.ts
import path from 'path';

describe('Cloud Functions (T011)', () => {
  test('exports include helloWorld and AI functions', async () => {
    const libPath = path.resolve(process.cwd(), 'functions/lib/index.js');

    const mod = require(libPath);
    expect(mod).toHaveProperty('helloWorld');
    expect(mod).toHaveProperty('aiThreadSummary');
    expect(mod).toHaveProperty('aiActionExtraction');
    expect(mod).toHaveProperty('aiPriorityDetection');
    expect(mod).toHaveProperty('aiSmartSearch');
    expect(mod).toHaveProperty('aiProactiveAgent');
    expect(mod).toHaveProperty('sendNotification');
  });
});
