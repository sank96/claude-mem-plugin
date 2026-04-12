const test = require('node:test');
const assert = require('node:assert/strict');

test('runtime policy selects agent-driven fallback for windows/codex', () => {
  const { selectRuntimePolicy } = require('../../core/runtime-policy.js');

  assert.equal(selectRuntimePolicy({ adapter: 'codex', platform: 'win32' }), 'agent-driven');
});

test('platform aliases normalize to win32', () => {
  const { normalizePlatform } = require('../../core/platform.js');

  assert.equal(normalizePlatform('windows'), 'win32');
});
