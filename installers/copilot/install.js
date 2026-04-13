'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const provider = require('../../adapters/copilot/provider.js');
const { resolveClaudeMemPaths } = require('../../core/paths.js');
const { selectRuntimePolicy } = require('../../core/runtime-policy.js');
const sharedFileUtils = require('../shared/file-utils.js');
const sharedSkillUtils = require('../shared/skill-utils.js');
const { normalizeRuntimeMode, summarizeInstallMode } = require('../shared/summary.js');
const {
  captureSnapshot,
  removeInstalledVersion,
  resolveInstallAction,
  restoreSnapshot,
  writeInstalledVersion,
} = require('../../core/installer-state.js');

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
    pluginRoot: upstreamPaths.pluginRoot,
    mcpServer: upstreamPaths.mcpServer,
  };
}

function validateCopilotInstallPrereqs(paths) {
  for (const requiredPath of [paths.pluginRoot, paths.mcpServer]) {
    if (!requiredPath || !fs.existsSync(requiredPath)) {
      throw new Error(`required upstream file is missing: ${requiredPath}`);
    }
  }
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
  const deps = {
    fileUtils: options.fileUtils ?? sharedFileUtils,
    skillUtils: options.skillUtils ?? sharedSkillUtils,
  };
  const paths = resolveCopilotPaths(options);
  const runtimePolicy = selectRuntimePolicy({
    adapter: provider.adapter,
    platform: options.platform,
  });
  const runtimeMode = normalizeRuntimeMode(runtimePolicy);
  const currentVersion = options.version ?? require('../../package.json').version;
  const installState = resolveInstallAction(paths.copilotHome, currentVersion);
  const canonicalSkillDir = path.join(paths.skillRoot, 'claude-mem');

  if (installState.action === 'skip') {
    return {
      action: installState.action,
      skipped: true,
      copilotHome: paths.copilotHome,
      configFile: paths.configFile,
      mcpServer: paths.mcpServer,
      runtimeMode,
      skillDir: canonicalSkillDir,
      skillRoot: paths.skillRoot,
      summary: `skipped (v${installState.installedVersion} already installed)`,
    };
  }

  validateCopilotInstallPrereqs(paths);
  deps.fileUtils.ensureDir(paths.copilotHome);

  const snapshot = captureSnapshot([paths.configFile, canonicalSkillDir]);

  try {
    const configJson = deps.fileUtils.readJson(paths.configFile, {});
    deps.fileUtils.writeJson(paths.configFile, mergeCopilotMcpConfig(configJson, paths.mcpServer));

    const skillPaths = deps.skillUtils.installSharedSkill({
      packageRoot: paths.packageRoot,
      skillRoot: paths.skillRoot,
      skillName: 'claude-mem',
    });

    writeInstalledVersion(paths.copilotHome, currentVersion);

    return {
      action: installState.action,
      skipped: false,
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
  } catch (error) {
    restoreSnapshot(snapshot);
    throw error;
  }
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
  validateCopilotInstallPrereqs,
};
