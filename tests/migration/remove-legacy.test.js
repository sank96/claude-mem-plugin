const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('legacy codex-mem directory is no longer required after migration', () => {
  const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
  const legacyRoot = path.join(workspaceRoot, 'codex-mem');
  assert.equal(fs.existsSync(legacyRoot), false);
});
