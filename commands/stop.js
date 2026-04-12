'use strict';

function buildStopCommand(lifecycle, workerClient) {
  return async function run(provider, payload) {
    return lifecycle.runSummarizeLifecycle(workerClient, provider, payload);
  };
}

module.exports = {
  buildStopCommand,
};
