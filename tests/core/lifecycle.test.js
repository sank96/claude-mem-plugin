const test = require('node:test');
const assert = require('node:assert/strict');

test('context lifecycle delegates to worker hook execution', async () => {
  const { runContextLifecycle } = require('../../core/lifecycle.js');

  const calls = [];
  const workerClient = {
    runHook(provider, phase, payload) {
      calls.push({ provider, phase, payload });
      return { continue: true };
    },
  };

  const result = await runContextLifecycle(workerClient, 'codex', { source: 'manual' });

  assert.deepEqual(result, { continue: true });
  assert.deepEqual(calls, [{ provider: 'codex', phase: 'context', payload: { source: 'manual' } }]);
});

test('complete lifecycle delegates to worker session completion', async () => {
  const { runCompleteLifecycle } = require('../../core/lifecycle.js');

  const calls = [];
  const workerClient = {
    completeSession(sessionId) {
      calls.push(sessionId);
      return true;
    },
  };

  const result = await runCompleteLifecycle(workerClient, 'codex', { sessionId: 'session-123' });

  assert.equal(result, true);
  assert.deepEqual(calls, ['session-123']);
});
