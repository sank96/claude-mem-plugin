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

async function handleSessionEnd(payload = {}, deps = {}) {
  const input = asObject(payload);

  try {
    return await resolveLifecycle(deps).runCompleteLifecycle(
      resolveWorkerClient(deps),
      provider.provider,
      input
    );
  } catch (_error) {
    return false;
  }
}

async function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;

  const payload = input ? JSON.parse(input) : {};
  await handleSessionEnd(payload);
  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[codex-mem] session-end error: ${error.message}\n`);
    process.exit(0);
  });
}

module.exports = {
  handleSessionEnd,
  main,
};
