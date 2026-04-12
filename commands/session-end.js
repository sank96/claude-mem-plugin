'use strict';

function buildSessionEndCommand(lifecycle, workerClient) {
  return async function run(provider, payload) {
    return lifecycle.runCompleteLifecycle(workerClient, provider, payload);
  };
}

module.exports = {
  buildSessionEndCommand,
};
