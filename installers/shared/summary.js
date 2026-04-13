'use strict';

const { selectRuntimePolicy } = require('../../core/runtime-policy.js');

function normalizeRuntimeMode(policy) {
  return policy === 'agent-driven' ? 'agent-driven fallback' : 'hook-driven';
}

function summarizeInstallMode({ adapter, platform } = {}) {
  const safeAdapter = String(adapter ?? 'unknown').trim() || 'unknown';
  const runtimeMode = normalizeRuntimeMode(
    selectRuntimePolicy({ adapter: safeAdapter, platform })
  );

  return `${safeAdapter} installed in ${runtimeMode} mode`;
}

module.exports = {
  normalizeRuntimeMode,
  summarizeInstallMode,
};
