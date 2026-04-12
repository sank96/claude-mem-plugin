'use strict';

function buildObserveCommand(lifecycle, workerClient) {
  return async function run(provider, payload) {
    return lifecycle.runObservationLifecycle(workerClient, provider, payload);
  };
}

module.exports = {
  buildObserveCommand,
};
