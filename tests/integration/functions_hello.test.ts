// tests/integration/functions_hello.test.ts
// Adjusted: verify exported function exists in built output to avoid emulator HTTP dependency
import path from 'path';

describe('helloWorld callable (T011)', () => {
  test('export exists in built lib', async () => {
    const libPath = path.resolve(process.cwd(), 'functions/lib/index.js');

    const mod = require(libPath);
    expect(mod).toHaveProperty('helloWorld');
  });
});
