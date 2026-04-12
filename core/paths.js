'use strict';

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
  const pluginRoot = options.pluginRoot ?? path.join(homeDir, DEFAULT_PLUGIN_RELATIVE_ROOT);
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
