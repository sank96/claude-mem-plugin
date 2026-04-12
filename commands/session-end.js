'use strict';

const { createWorkerClient } = require('../core/worker-client.js');
const lifecycle = require('../core/lifecycle.js');

function resolveLifecycle(deps = {}) {
  return deps.lifecycle ?? lifecycle;
}

function resolveWorkerClient(deps = {}) {
  return deps.workerClient ?? createWorkerClient(deps.workerOptions);
}

function assertPayload(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('session-end command requires an object payload');
  }
}

async function sessionEndCommand(payload, deps = {}) {
  assertPayload(payload);

  return resolveLifecycle(deps).runCompleteLifecycle(
    resolveWorkerClient(deps),
    payload
  );
}

function buildSessionEndCommand(deps = {}) {
  return function runSessionEndCommand(payload) {
    return sessionEndCommand(payload, deps);
  };
}

module.exports = {
  buildSessionEndCommand,
  sessionEndCommand,
};
