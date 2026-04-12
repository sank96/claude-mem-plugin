const test = require('node:test');
const assert = require('node:assert/strict');

test('session-start command delegates to the context lifecycle', async () => {
  const { buildSessionStartCommand } = require('../../commands/session-start.js');

  const calls = [];
  const lifecycle = {
    runContextLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return { continue: true };
    },
  };
  const workerClient = { id: 'worker-client' };

  const run = buildSessionStartCommand(lifecycle, workerClient);
  const result = await run('codex', { source: 'manual' });

  assert.deepEqual(result, { continue: true });
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { source: 'manual' },
    },
  ]);
});

test('observe command delegates to the observation lifecycle', async () => {
  const { buildObserveCommand } = require('../../commands/observe.js');

  const calls = [];
  const lifecycle = {
    runObservationLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return { continue: true, suppressOutput: true };
    },
  };
  const workerClient = { id: 'worker-client' };

  const run = buildObserveCommand(lifecycle, workerClient);
  const result = await run('codex', { tool_name: 'Read' });

  assert.deepEqual(result, { continue: true, suppressOutput: true });
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { tool_name: 'Read' },
    },
  ]);
});

test('stop command delegates to the summarize lifecycle', async () => {
  const { buildStopCommand } = require('../../commands/stop.js');

  const calls = [];
  const lifecycle = {
    runSummarizeLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return { continue: false };
    },
  };
  const workerClient = { id: 'worker-client' };

  const run = buildStopCommand(lifecycle, workerClient);
  const result = await run('codex', { stop_hook_active: true });

  assert.deepEqual(result, { continue: false });
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { stop_hook_active: true },
    },
  ]);
});

test('session-end command delegates to the complete lifecycle', async () => {
  const { buildSessionEndCommand } = require('../../commands/session-end.js');

  const calls = [];
  const lifecycle = {
    runCompleteLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return false;
    },
  };
  const workerClient = { id: 'worker-client' };

  const run = buildSessionEndCommand(lifecycle, workerClient);
  const result = await run('codex', { sessionId: 'session-123' });

  assert.equal(result, false);
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { sessionId: 'session-123' },
    },
  ]);
});
