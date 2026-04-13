const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execSync } = require('node:child_process');

test('npm pack excludes internal superpowers artifacts', () => {
  const root = path.resolve(__dirname, '..', '..');
  const output = execSync('npm pack --json --dry-run', {
    cwd: root,
    encoding: 'utf8',
  });
  const [{ files }] = JSON.parse(output);
  const packedPaths = files.map((file) => file.path);

  assert.ok(packedPaths.includes('package.json'));
  assert.ok(packedPaths.includes('README.md'));
  assert.ok(packedPaths.includes('docs/installation.md'));
  assert.ok(packedPaths.includes('docs/upstream-compatibility.md'));
  assert.ok(!packedPaths.some((file) => file.startsWith('docs/superpowers/')));
});
