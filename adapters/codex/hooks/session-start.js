'use strict';

const { createWorkerClient } = require('../../../core/worker-client.js');
const lifecycle = require('../../../core/lifecycle.js');
const provider = require('../provider.js');

function resolveLifecycle(deps = {}) {
  return deps.lifecycle ?? lifecycle;
}

function resolveWorkerClient(deps = {}) {
  return deps.workerClient ?? createWorkerClient(deps.workerOptions);
}

function asObject(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  return payload;
}

async function handleSessionStart(payload = {}, deps = {}) {
  const input = asObject(payload);

  if (input.source === 'resume') {
    return { continue: true };
  }

  const workerClient = resolveWorkerClient(deps);

  if (typeof workerClient.ensureWorker === 'function') {
    const ready = await workerClient.ensureWorker();
    if (!ready) {
      return { continue: true };
    }
  }

  try {
    return await resolveLifecycle(deps).runContextLifecycle(
      workerClient,
      provider.provider,
      input
    );
  } catch (_error) {
    return { continue: true };
  }
}

async function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;

  const payload = input ? JSON.parse(input) : {};
  const result = await handleSessionStart(payload);
  process.stdout.write(JSON.stringify(result ?? { continue: true }));
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[codex-mem] session-start error: ${error.message}\n`);
    process.exit(0);
  });
}

module.exports = {
  handleSessionStart,
  main,
};
