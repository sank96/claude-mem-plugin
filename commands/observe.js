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
    throw new TypeError('observe command requires a provider');
  }
}

function assertPayload(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('observe command requires an object payload');
  }
}

async function observeCommand(provider, payload = {}, deps = {}) {
  assertProvider(provider);
  assertPayload(payload);

  return resolveLifecycle(deps).runObservationLifecycle(
    resolveWorkerClient(deps),
    provider.trim(),
    payload
  );
}

function buildObserveCommand(deps = {}) {
  return function runObserveCommand(provider, payload) {
    return observeCommand(provider, payload, deps);
  };
}

module.exports = {
  buildObserveCommand,
  observeCommand,
};
