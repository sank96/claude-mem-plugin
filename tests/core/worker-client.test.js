const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');

test('worker client runs a provider hook with the shared worker service', () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const calls = [];
  const client = createWorkerClient({
    paths: {
      bunRunner: '/tmp/bun-runner.js',
      workerService: '/tmp/worker-service.cjs',
    },
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
    '/tmp/bun-runner.js',
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

test('worker client invokes the shared runner when running hooks', () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const calls = [];
  const client = createWorkerClient({
    paths: {
      bunRunner: '/tmp/bun-runner.js',
      workerService: '/tmp/worker-service.cjs',
    },
    execFileSync: (command, args, options) => {
      calls.push({ command, args, options });
      return JSON.stringify({ continue: true });
    },
  });

  client.runHook('codex', 'observation', { tool_name: 'Read' });

  assert.equal(calls[0].args[0], '/tmp/bun-runner.js');
  assert.deepEqual(calls[0].args.slice(1), [
    '/tmp/worker-service.cjs',
    'hook',
    'codex',
    'observation',
  ]);
});

test('ensureWorker retries health checks and spawns the worker once', async () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const requests = [false, false, true];
  const spawnCalls = [];
  const client = createWorkerClient({
    paths: {
      bunRunner: '/tmp/bun-runner.js',
      workerService: '/tmp/worker-service.cjs',
    },
    http: {
      get(_url, callback) {
        const shouldSucceed = requests.shift();
        const req = new EventEmitter();
        req.setTimeout = (_ms, handler) => {
          if (shouldSucceed === false) {
            setImmediate(handler);
          }
        };
        req.destroy = () => {};
        if (shouldSucceed) {
          setImmediate(() => callback({ statusCode: 200 }));
        }
        return req;
      },
    },
    retryCount: 3,
    retryDelayMs: 0,
    spawn: (command, args, options) => {
      spawnCalls.push({ command, args, options });
      return { unref() {} };
    },
  });

  const result = await client.ensureWorker();

  assert.equal(result, true);
  assert.equal(spawnCalls.length, 1);
  assert.deepEqual(spawnCalls[0].args, [
    '/tmp/bun-runner.js',
    '/tmp/worker-service.cjs',
    'start',
  ]);
});

test('checkHealth returns false on request error', async () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const client = createWorkerClient({
    http: {
      get() {
        const req = new EventEmitter();
        req.setTimeout = () => {};
        req.destroy = () => {};
        setImmediate(() => req.emit('error', new Error('boom')));
        return req;
      },
    },
  });

  assert.equal(await client.checkHealth(), false);
});

test('checkHealth returns false on timeout', async () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const client = createWorkerClient({
    http: {
      get(_url, callback) {
        const req = new EventEmitter();
        req.setTimeout = (_ms, handler) => {
          setImmediate(handler);
        };
        req.destroy = () => {};
        callback({ statusCode: 500 });
        return req;
      },
    },
  });

  assert.equal(await client.checkHealth(), false);
});

test('completeSession reports failure when the worker never acknowledges', async () => {
  const { createWorkerClient } = require('../../core/worker-client.js');

  const client = createWorkerClient({
    workerPort: 4124,
    http: {
      request(_options, callback) {
        const req = {
          setTimeout(_ms, handler) {
            setImmediate(handler);
          },
          on() {
            return this;
          },
          end() {
          },
          destroy() {},
        };
        return req;
      },
    },
  });

  assert.equal(await client.completeSession('session-999'), false);
});
