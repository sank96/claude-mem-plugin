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
    throw new TypeError('session-start command requires a provider');
  }
}

function assertPayload(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('session-start command requires an object payload');
  }
}

async function sessionStartCommand(provider, payload = {}, deps = {}) {
  assertProvider(provider);
  assertPayload(payload);

  return resolveLifecycle(deps).runContextLifecycle(
    resolveWorkerClient(deps),
    provider.trim(),
    payload
  );
}

function buildSessionStartCommand(deps = {}) {
  return function runSessionStartCommand(provider, payload) {
    return sessionStartCommand(provider, payload, deps);
  };
}

module.exports = {
  buildSessionStartCommand,
  sessionStartCommand,
};
