'use strict';

function buildSessionStartCommand(lifecycle, workerClient) {
  return async function run(provider, payload) {
    return lifecycle.runContextLifecycle(workerClient, provider, payload);
  };
}

module.exports = {
  buildSessionStartCommand,
};
