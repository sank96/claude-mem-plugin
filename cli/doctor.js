'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveClaudeMemPaths } = require('../core/paths.js');
const { selectRuntimePolicy } = require('../core/runtime-policy.js');
const { readInstalledVersion } = require('../core/installer-state.js');

function resolveProbeTargets(options = {}) {
  const homeDir = options.homeDir ?? os.homedir();
  const upstreamPaths = options.upstreamPaths ?? resolveClaudeMemPaths({
    ...options,
    homeDir,
  });
  const codexHooksPolicy = selectRuntimePolicy({
    adapter: 'codex',
    platform: options.platform,
  });

  return {
    upstream: {
      pluginRoot: options.pluginRoot ?? upstreamPaths.pluginRoot,
    },
    codex: {
      adapterHome: path.join(homeDir, '.codex'),
      configFile: options.codexConfigFile ?? path.join(homeDir, '.codex', 'config.toml'),
      hooksFile: codexHooksPolicy === 'hook-driven'
        ? options.codexHooksFile ?? path.join(homeDir, '.codex', 'hooks.json')
        : undefined,
      skillDir: options.codexSkillDir ?? path.join(homeDir, '.agents', 'skills', 'claude-mem'),
    },
    claude: {
      adapterHome: path.join(homeDir, '.claude'),
      configFile: options.claudeConfigFile ?? path.join(homeDir, '.claude', 'settings.json'),
      skillDir: options.claudeSkillDir ?? path.join(homeDir, '.claude', 'skills', 'claude-mem'),
    },
    copilot: {
      adapterHome: path.join(homeDir, '.copilot'),
      configFile: options.copilotConfigFile ?? path.join(homeDir, '.copilot', 'mcp-config.json'),
      skillDir: options.copilotSkillDir ?? path.join(homeDir, '.copilot', 'skills', 'claude-mem'),
    },
  };
}

function probeAdapter(adapter, targets) {
  const missing = [];

  if (!fs.existsSync(targets.configFile)) {
    missing.push('config');
  }

  if (targets.hooksFile !== undefined && !fs.existsSync(targets.hooksFile)) {
    missing.push('hooks');
  }

  if (!fs.existsSync(targets.skillDir)) {
    missing.push('skill');
  }

  return {
    adapter,
    installed: missing.length === 0,
    missing,
    version: targets.adapterHome ? readInstalledVersion(targets.adapterHome) : null,
  };
}

function formatAdapterLine(adapter) {
  const version = adapter.version ? `v${adapter.version}` : '—';
  const status = adapter.installed ? 'installed' : 'NOT INSTALLED';

  if (adapter.installed) {
    return `[${adapter.adapter}] ${version} → ${status}`;
  }

  return `[${adapter.adapter}] ${version} → ${status} (${adapter.missing.join(', ')})`;
}

function formatDoctorReport(report) {
  const upstreamStatus = report.upstream.ok ? 'OK' : 'MISSING';
  const lines = [`upstream claude-mem: ${upstreamStatus} (${report.upstream.pluginRoot})`, ''];

  for (const adapter of report.adapters) {
    lines.push(formatAdapterLine(adapter));
  }

  return lines.join('\n');
}

async function runDoctor(options = {}) {
  const targets = resolveProbeTargets(options);
  const upstream = {
    ok: fs.existsSync(targets.upstream.pluginRoot),
    pluginRoot: targets.upstream.pluginRoot,
  };
  const adapters = [
    probeAdapter('codex', targets.codex),
    probeAdapter('claude', targets.claude),
    probeAdapter('copilot', targets.copilot),
  ];
  const summary = formatDoctorReport({ upstream, adapters });

  return {
    ok: upstream.ok && adapters.every((adapter) => adapter.installed),
    summary,
  };
}

module.exports = {
  formatDoctorReport,
  probeAdapter,
  resolveProbeTargets,
  runDoctor,
};
