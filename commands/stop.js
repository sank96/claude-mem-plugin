'use strict';

const { createWorkerClient } = require('../core/worker-client.js');
const lifecycle = require('../core/lifecycle.js');

function resolveLifecycle(deps = {}) {
  return deps.lifecycle ?? lifecycle;
}

function resolveWorkerClient(deps = {}) {
  return deps.workerClient ?? createWorkerClient(deps.workerOptions);
}

function assertProvider(provider) {
  if (typeof provider !== 'string' || provider.trim() === '') {
    throw new TypeError('stop command requires a provider');
  }
}

function assertPayload(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('stop command requires an object payload');
  }
}

async function stopCommand(provider, payload = {}, deps = {}) {
  assertProvider(provider);
  assertPayload(payload);

  return resolveLifecycle(deps).runSummarizeLifecycle(
    resolveWorkerClient(deps),
    provider.trim(),
    payload
  );
}

function buildStopCommand(deps = {}) {
  return function runStopCommand(provider, payload) {
    return stopCommand(provider, payload, deps);
  };
}

module.exports = {
  buildStopCommand,
  stopCommand,
};
