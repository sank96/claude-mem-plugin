const test = require('node:test');
const assert = require('node:assert/strict');

test('session-start is directly invocable and validates provider input', async () => {
  const { sessionStartCommand, buildSessionStartCommand } = require('../../commands/session-start.js');

  assert.equal(typeof sessionStartCommand, 'function');
  assert.equal(typeof buildSessionStartCommand, 'function');

  const calls = [];
  const lifecycle = {
    runContextLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return { continue: true };
    },
  };
  const workerClient = { id: 'worker-client' };

  const result = await sessionStartCommand('codex', { source: 'manual' }, { lifecycle, workerClient });
  assert.deepEqual(result, { continue: true });
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { source: 'manual' },
    },
  ]);

  await assert.rejects(
    () => sessionStartCommand('', { source: 'manual' }, { lifecycle, workerClient }),
    /provider/i
  );
});

test('observe is directly invocable and validates payload input', async () => {
  const { observeCommand, buildObserveCommand } = require('../../commands/observe.js');

  assert.equal(typeof observeCommand, 'function');
  assert.equal(typeof buildObserveCommand, 'function');

  const calls = [];
  const lifecycle = {
    runObservationLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return { continue: true, suppressOutput: true };
    },
  };
  const workerClient = { id: 'worker-client' };

  const result = await observeCommand('codex', { tool_name: 'Read' }, { lifecycle, workerClient });
  assert.deepEqual(result, { continue: true, suppressOutput: true });
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { tool_name: 'Read' },
    },
  ]);

  await assert.rejects(
    () => observeCommand('codex', null, { lifecycle, workerClient }),
    /payload/i
  );
});

test('stop is directly invocable and validates provider input', async () => {
  const { stopCommand, buildStopCommand } = require('../../commands/stop.js');

  assert.equal(typeof stopCommand, 'function');
  assert.equal(typeof buildStopCommand, 'function');

  const calls = [];
  const lifecycle = {
    runSummarizeLifecycle(workerClient, provider, payload) {
      calls.push({ workerClient, provider, payload });
      return { continue: false };
    },
  };
  const workerClient = { id: 'worker-client' };

  const result = await stopCommand('codex', { stop_hook_active: true }, { lifecycle, workerClient });
  assert.deepEqual(result, { continue: false });
  assert.deepEqual(calls, [
    {
      workerClient,
      provider: 'codex',
      payload: { stop_hook_active: true },
    },
  ]);

  await assert.rejects(
    () => stopCommand(undefined, { stop_hook_active: true }, { lifecycle, workerClient }),
    /provider/i
  );
});

test('session-end is provider-agnostic and directly invocable', async () => {
  const { sessionEndCommand, buildSessionEndCommand } = require('../../commands/session-end.js');

  assert.equal(typeof sessionEndCommand, 'function');
  assert.equal(typeof buildSessionEndCommand, 'function');
  assert.equal(sessionEndCommand.length, 1);

  const calls = [];
  const lifecycle = {
    runCompleteLifecycle(workerClient, payload) {
      calls.push({ workerClient, payload });
      return false;
    },
  };
  const workerClient = { id: 'worker-client' };

  const result = await sessionEndCommand({ sessionId: 'session-123' }, { lifecycle, workerClient });
  assert.equal(result, false);
  assert.deepEqual(calls, [
    {
      workerClient,
      payload: { sessionId: 'session-123' },
    },
  ]);

  await assert.rejects(
    () => sessionEndCommand(null, { lifecycle, workerClient }),
    /payload/i
  );
});
