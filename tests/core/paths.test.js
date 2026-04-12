const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('paths resolve upstream worker-service.cjs', () => {
  const { resolveClaudeMemPaths } = require('../../core/paths.js');

  const paths = resolveClaudeMemPaths({ homeDir: '/tmp/home' });

  assert.equal(
    paths.pluginRoot,
    path.join('/tmp/home', '.claude', 'plugins', 'marketplaces', 'thedotmack', 'plugin')
  );
  assert.equal(paths.workerService, path.join(paths.pluginRoot, 'scripts', 'worker-service.cjs'));
});
