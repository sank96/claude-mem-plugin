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

test('observation lifecycle delegates to worker hook execution', async () => {
  const { runObservationLifecycle } = require('../../core/lifecycle.js');

  const calls = [];
  const workerClient = {
    runHook(provider, phase, payload) {
      calls.push({ provider, phase, payload });
      return { continue: true, suppressOutput: true };
    },
  };

  const result = await runObservationLifecycle(workerClient, 'codex', { tool_name: 'Read' });

  assert.deepEqual(result, { continue: true, suppressOutput: true });
  assert.deepEqual(calls, [{ provider: 'codex', phase: 'observation', payload: { tool_name: 'Read' } }]);
});

test('summarize lifecycle delegates to worker hook execution', async () => {
  const { runSummarizeLifecycle } = require('../../core/lifecycle.js');

  const calls = [];
  const workerClient = {
    runHook(provider, phase, payload) {
      calls.push({ provider, phase, payload });
      return { continue: false };
    },
  };

  const result = await runSummarizeLifecycle(workerClient, 'codex', { stop_hook_active: true });

  assert.deepEqual(result, { continue: false });
  assert.deepEqual(calls, [{ provider: 'codex', phase: 'summarize', payload: { stop_hook_active: true } }]);
});

test('complete lifecycle delegates to worker session completion', async () => {
  const { runCompleteLifecycle } = require('../../core/lifecycle.js');

  const calls = [];
  const workerClient = {
    completeSession(sessionId) {
      calls.push(sessionId);
      return false;
    },
  };

  const result = await runCompleteLifecycle(workerClient, 'codex', { sessionId: 'session-123' });

  assert.equal(result, false);
  assert.deepEqual(calls, ['session-123']);
});
