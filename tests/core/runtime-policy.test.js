const test = require('node:test');
const assert = require('node:assert/strict');

test('runtime policy selects agent-driven fallback for windows/codex', () => {
  const { selectRuntimePolicy } = require('../../core/runtime-policy.js');

  assert.equal(selectRuntimePolicy({ adapter: 'codex', platform: 'win32' }), 'agent-driven');
});

test('runtime policy keeps copilot on agent-driven fallback for darwin and win32', () => {
  const { selectRuntimePolicy } = require('../../core/runtime-policy.js');

  assert.equal(selectRuntimePolicy({ adapter: 'copilot', platform: 'darwin' }), 'agent-driven');
  assert.equal(selectRuntimePolicy({ adapter: 'copilot', platform: 'win32' }), 'agent-driven');
});

test('platform aliases normalize to win32', () => {
  const { normalizePlatform } = require('../../core/platform.js');

  assert.equal(normalizePlatform('windows'), 'win32');
});
