const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relPath) {
  const root = path.resolve(__dirname, '..', '..', '..');
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('codex provider metadata names the adapter and hook phases', () => {
  const provider = require('../../../adapters/codex/provider.js');

  assert.equal(provider.adapter, 'codex');
  assert.equal(provider.provider, 'codex');
  assert.deepEqual(provider.hooks, {
    sessionStart: 'hooks/session-start.js',
    postToolUse: 'hooks/post-tool-use.js',
    stop: 'hooks/stop.js',
    sessionEnd: 'hooks/session-end.js',
  });
});

test('session-start hook ignores resume payloads and delegates context lifecycle otherwise', async () => {
  const { handleSessionStart } = require('../../../adapters/codex/hooks/session-start.js');

  const resumeResult = await handleSessionStart({ source: 'resume' });
  assert.deepEqual(resumeResult, { continue: true });

  const calls = [];
  const workerClient = {
    ensureWorker: async () => true,
    runHook(provider, phase, payload) {
      calls.push({ provider, phase, payload });
      return { continue: false };
    },
  };

  const result = await handleSessionStart({ source: 'manual' }, { workerClient });

  assert.deepEqual(result, { continue: false });
  assert.deepEqual(calls, [
    {
      provider: 'codex',
      phase: 'context',
      payload: { source: 'manual' },
    },
  ]);
});

test('post-tool-use hook skips configured tools and delegates observation lifecycle', async () => {
  const { handlePostToolUse } = require('../../../adapters/codex/hooks/post-tool-use.js');

  const skipped = await handlePostToolUse({ tool_name: 'Skill' });
  assert.deepEqual(skipped, { continue: true, suppressOutput: true });

  const calls = [];
  const workerClient = {
    checkHealth: async () => true,
    runHook(provider, phase, payload) {
      calls.push({ provider, phase, payload });
      return { continue: true, suppressOutput: true };
    },
  };

  const result = await handlePostToolUse({ tool_name: 'Read' }, { workerClient });

  assert.deepEqual(result, { continue: true, suppressOutput: true });
  assert.deepEqual(calls, [
    {
      provider: 'codex',
      phase: 'observation',
      payload: { tool_name: 'Read' },
    },
  ]);
});

test('stop hook ignores recursive payloads and delegates summarize lifecycle otherwise', async () => {
  const { handleStop } = require('../../../adapters/codex/hooks/stop.js');

  const guarded = await handleStop({ stop_hook_active: true });
  assert.deepEqual(guarded, { continue: true, suppressOutput: true });

  const calls = [];
  const workerClient = {
    checkHealth: async () => true,
    runHook(provider, phase, payload) {
      calls.push({ provider, phase, payload });
      return { continue: true, suppressOutput: true };
    },
  };

  const result = await handleStop({ stop_hook_active: false }, { workerClient });

  assert.deepEqual(result, { continue: true, suppressOutput: true });
  assert.deepEqual(calls, [
    {
      provider: 'codex',
      phase: 'summarize',
      payload: { stop_hook_active: false },
    },
  ]);
});

test('session-end hook maps session_id to shared completion', async () => {
  const { handleSessionEnd } = require('../../../adapters/codex/hooks/session-end.js');

  const calls = [];
  const workerClient = {
    completeSession(sessionId) {
      calls.push(sessionId);
      return true;
    },
  };

  const result = await handleSessionEnd({ session_id: 'session-123' }, { workerClient });

  assert.equal(result, true);
  assert.deepEqual(calls, ['session-123']);
});

test('codex mcp block references the codex hooks and provider metadata', () => {
  const block = read('adapters/codex/mcp-config/block.toml');

  assert.match(block, /provider\s*=\s*"codex"/);
  assert.match(block, /session-start\.js/);
  assert.match(block, /post-tool-use\.js/);
  assert.match(block, /stop\.js/);
  assert.match(block, /session-end\.js/);
});
