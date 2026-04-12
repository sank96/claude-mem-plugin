const test = require('node:test');
const assert = require('node:assert/strict');

test('worker client runs a provider hook with the shared worker service', () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const calls = [];
  const client = createWorkerClient({
    paths: { workerService: '/tmp/worker-service.cjs' },
    execFileSync: (command, args, options) => {
      calls.push({ command, args, options });
      return JSON.stringify({ continue: false, suppressOutput: true });
    },
  });

  const result = client.runHook('codex', 'context', { source: 'manual' });

  assert.deepEqual(result, { continue: false, suppressOutput: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, process.execPath);
  assert.deepEqual(calls[0].args, [
    '/tmp/worker-service.cjs',
    'hook',
    'codex',
    'context',
  ]);
});

test('worker client posts session completion', async () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const requests = [];
  const client = createWorkerClient({
    workerPort: 4123,
    http: {
      request(options, callback) {
        const req = {
          setTimeout() {},
          on(event, handler) {
            if (event === 'error') this.errorHandler = handler;
            return this;
          },
          end(body) {
            requests.push({ options, body });
            callback({ statusCode: 204 });
          },
          destroy() {},
        };
        return req;
      },
    },
  });

  await client.completeSession('session-123');

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.path, '/api/sessions/complete');
  assert.equal(JSON.parse(requests[0].body).contentSessionId, 'session-123');
});
