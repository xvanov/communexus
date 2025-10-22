// tests/unit/hosting_config.test.ts
// T017 - Hosting config tests
import fs from 'fs';
import path from 'path';

const firebaseJsonPath = path.resolve(process.cwd(), 'firebase.json');

describe('Hosting config (T017)', () => {
  test('firebase.json has hosting public dist and rewrites', () => {
    const cfg = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    expect(cfg).toHaveProperty('hosting.public', 'dist');
    expect(cfg.hosting).toHaveProperty('rewrites');
  });

  test('dist/index.html exists', () => {
    const indexPath = path.resolve(process.cwd(), 'dist/index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
  });
});
