'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const provider = require('../../adapters/copilot/provider.js');
const { resolveClaudeMemPaths } = require('../../core/paths.js');
const { selectRuntimePolicy } = require('../../core/runtime-policy.js');
const {
  ensureDir,
  readJson,
  writeJson,
} = require('../shared/file-utils.js');
const { installSharedSkill } = require('../shared/skill-utils.js');
const { normalizeRuntimeMode, summarizeInstallMode } = require('../shared/summary.js');

function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function resolveCopilotPaths(options = {}) {
  const packageRoot = options.packageRoot ?? path.resolve(__dirname, '..', '..');
  const copilotHome = options.copilotHome ?? path.join(os.homedir(), '.copilot');
  const skillRoot = options.skillRoot ?? path.join(copilotHome, 'skills');
  const upstreamPaths = options.upstreamPaths ?? resolveClaudeMemPaths(options);

  return {
    packageRoot,
    copilotHome,
    skillRoot,
    configFile: path.join(copilotHome, 'mcp-config.json'),
    adapterRoot: path.join(packageRoot, 'adapters', 'copilot'),
    mcpServer: upstreamPaths.mcpServer,
  };
}

function buildCopilotMcpConfig(mcpServerPath) {
  return {
    mcpServers: {
      'claude-mem': {
        command: 'node',
        args: [normalizeFilePath(mcpServerPath)],
      },
    },
  };
}

function mergeCopilotMcpConfig(existingConfig = {}, mcpServerPath) {
  const nextConfig = { ...existingConfig };
  const mcpServers = { ...(existingConfig.mcpServers ?? {}) };

  mcpServers['claude-mem'] = buildCopilotMcpConfig(mcpServerPath).mcpServers['claude-mem'];
  nextConfig.mcpServers = mcpServers;

  return nextConfig;
}

async function installCopilotAdapter(options = {}) {
  const paths = resolveCopilotPaths(options);
  const runtimePolicy = selectRuntimePolicy({
    adapter: provider.adapter,
    platform: options.platform,
  });
  const runtimeMode = normalizeRuntimeMode(runtimePolicy);

  ensureDir(paths.copilotHome);

  const configJson = readJson(paths.configFile, {});
  writeJson(paths.configFile, mergeCopilotMcpConfig(configJson, paths.mcpServer));

  const skillPaths = installSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: paths.skillRoot,
    skillName: 'claude-mem',
  });

  return {
    copilotHome: paths.copilotHome,
    configFile: paths.configFile,
    mcpServer: paths.mcpServer,
    runtimeMode,
    skillDir: skillPaths.targetDir,
    skillRoot: paths.skillRoot,
    summary: summarizeInstallMode({
      adapter: provider.adapter,
      platform: options.platform,
    }),
  };
}

async function main() {
  const result = await installCopilotAdapter();
  process.stdout.write(`${result.summary}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] copilot install error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  buildCopilotMcpConfig,
  installCopilotAdapter,
  mergeCopilotMcpConfig,
  normalizeFilePath,
  resolveCopilotPaths,
};
