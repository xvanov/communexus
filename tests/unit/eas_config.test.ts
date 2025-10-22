// tests/unit/eas_config.test.ts
// T018 - EAS build config tests
import fs from 'fs';
import path from 'path';

const easPath = path.resolve(process.cwd(), 'eas.json');

describe('EAS config (T018)', () => {
  test('build profiles exist and CLI version set', () => {
    const cfg = JSON.parse(fs.readFileSync(easPath, 'utf8'));
    expect(cfg).toHaveProperty('cli.version');
    expect(cfg).toHaveProperty('build.development');
    expect(cfg).toHaveProperty('build.preview');
    expect(cfg).toHaveProperty('build.production');
  });
});
