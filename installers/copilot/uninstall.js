'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  readJson,
  writeJson,
} = require('../shared/file-utils.js');
const { uninstallSharedSkill } = require('../shared/skill-utils.js');
const {
  resolveCopilotPaths,
} = require('./install.js');

function pruneCopilotMcpConfig(existingConfig = {}) {
  const nextConfig = { ...existingConfig };
  const mcpServers = { ...(existingConfig.mcpServers ?? {}) };

  delete mcpServers['claude-mem'];

  if (Object.keys(mcpServers).length > 0) {
    nextConfig.mcpServers = mcpServers;
  } else {
    delete nextConfig.mcpServers;
  }

  return nextConfig;
}

async function uninstallCopilotAdapter(options = {}) {
  const paths = resolveCopilotPaths({
    ...options,
    copilotHome: options.copilotHome ?? path.join(os.homedir(), '.copilot'),
    skillRoot: options.skillRoot ?? path.join(
      options.copilotHome ?? path.join(os.homedir(), '.copilot'),
      'skills'
    ),
  });

  if (fs.existsSync(paths.configFile)) {
    const configJson = readJson(paths.configFile, {});
    const nextConfig = pruneCopilotMcpConfig(configJson);

    if (Object.keys(nextConfig).length === 0) {
      fs.rmSync(paths.configFile, { force: true });
    } else {
      writeJson(paths.configFile, nextConfig);
    }
  }

  uninstallSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: paths.skillRoot,
    skillName: 'claude-mem',
  });

  return { removed: true };
}

async function main() {
  await uninstallCopilotAdapter();
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] copilot uninstall error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  pruneCopilotMcpConfig,
  uninstallCopilotAdapter,
};
