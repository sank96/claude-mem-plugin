'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_PLUGIN_RELATIVE_ROOT = path.join(
  '.claude',
  'plugins',
  'marketplaces',
  'thedotmack',
  'plugin'
);

function resolveClaudeMemPaths(options = {}) {
  const homeDir = options.homeDir ?? os.homedir();
  const legacyPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  if (options.pluginRoot) {
    return buildPaths(path.resolve(options.pluginRoot), homeDir);
  }

  if (legacyPluginRoot) {
    return buildPaths(path.resolve(legacyPluginRoot), homeDir);
  }

  const searchBases = [
    ...(Array.isArray(options.searchRoots) ? options.searchRoots : []),
    homeDir,
    process.cwd(),
  ];

  const discoveredRoot = searchBases
    .map((base) => path.join(path.resolve(base), DEFAULT_PLUGIN_RELATIVE_ROOT))
    .find((candidate) => fs.existsSync(path.join(candidate, 'scripts', 'worker-service.cjs')))
    ?? path.join(homeDir, DEFAULT_PLUGIN_RELATIVE_ROOT);

  return buildPaths(discoveredRoot, homeDir);
}

function buildPaths(pluginRoot, homeDir) {
  const scriptsDir = path.join(pluginRoot, 'scripts');

  return {
    homeDir,
    pluginRoot,
    scriptsDir,
    bunRunner: path.join(scriptsDir, 'bun-runner.js'),
    workerService: path.join(scriptsDir, 'worker-service.cjs'),
    mcpServer: path.join(scriptsDir, 'mcp-server.cjs'),
  };
}

module.exports = {
  DEFAULT_PLUGIN_RELATIVE_ROOT,
  resolveClaudeMemPaths,
};
