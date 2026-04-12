'use strict';

const { normalizePlatform } = require('./platform.js');

function selectRuntimePolicy(options = {}) {
  const adapter = String(options.adapter ?? 'codex').trim().toLowerCase();
  const platform = normalizePlatform(options.platform);

  if (platform === 'win32') {
    return 'agent-driven';
  }

  if (adapter === 'codex') {
    return 'hook-driven';
  }

  return 'hook-driven';
}

module.exports = {
  selectRuntimePolicy,
};
