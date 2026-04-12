'use strict';

const { createWorkerClient } = require('../../../core/worker-client.js');
const lifecycle = require('../../../core/lifecycle.js');
const provider = require('../provider.js');

const SKIP_TOOLS = new Set([
  'ListMcpResourcesTool',
  'SlashCommand',
  'Skill',
  'TodoWrite',
  'AskUserQuestion',
]);

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

async function handlePostToolUse(payload = {}, deps = {}) {
  const input = asObject(payload);

  if (SKIP_TOOLS.has(input.tool_name)) {
    return { continue: true, suppressOutput: true };
  }

  const workerClient = resolveWorkerClient(deps);

  if (typeof workerClient.checkHealth === 'function') {
    const alive = await workerClient.checkHealth();
    if (!alive) {
      return { continue: true, suppressOutput: true };
    }
  }

  try {
    return await resolveLifecycle(deps).runObservationLifecycle(
      workerClient,
      provider.provider,
      input
    );
  } catch (_error) {
    return { continue: true, suppressOutput: true };
  }
}

async function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;

  const payload = input ? JSON.parse(input) : {};
  const result = await handlePostToolUse(payload);
  process.stdout.write(JSON.stringify(result ?? { continue: true, suppressOutput: true }));
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[codex-mem] post-tool-use error: ${error.message}\n`);
    process.exit(0);
  });
}

module.exports = {
  handlePostToolUse,
  main,
};
