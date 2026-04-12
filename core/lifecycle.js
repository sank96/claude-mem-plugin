'use strict';

async function runContextLifecycle(workerClient, provider, payload) {
  return workerClient.runHook(provider, 'context', payload);
}

async function runObservationLifecycle(workerClient, provider, payload) {
  return workerClient.runHook(provider, 'observation', payload);
}

async function runSummarizeLifecycle(workerClient, provider, payload) {
  return workerClient.runHook(provider, 'summarize', payload);
}

async function runCompleteLifecycle(workerClient, provider, payload = {}) {
  return workerClient.completeSession(payload.sessionId ?? payload.session_id);
}

module.exports = {
  runCompleteLifecycle,
  runContextLifecycle,
  runObservationLifecycle,
  runSummarizeLifecycle,
};
