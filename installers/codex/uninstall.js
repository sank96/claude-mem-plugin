'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  readJson,
  writeJson,
  writeText,
} = require('../shared/file-utils.js');
const { uninstallSharedSkill } = require('../shared/skill-utils.js');
const {
  resolveCodexPaths,
  stripExistingMcpBlock,
} = require('./install.js');

function cleanupHooks(currentHooks = {}) {
  const nextHooks = {};

  for (const [event, entries] of Object.entries(currentHooks)) {
    const keptEntries = entries.filter(
      (entry) => !JSON.stringify(entry).includes('claude-mem-plugin')
    );

    if (keptEntries.length > 0) {
      nextHooks[event] = keptEntries;
    }
  }

  return nextHooks;
}

async function uninstallCodexAdapter(options = {}) {
  const paths = resolveCodexPaths({
    ...options,
    codexHome: options.codexHome ?? path.join(os.homedir(), '.codex'),
  });

  if (fs.existsSync(paths.hooksFile)) {
    const hooksJson = readJson(paths.hooksFile, {});
    hooksJson.hooks = cleanupHooks(hooksJson.hooks ?? {});
    writeJson(paths.hooksFile, hooksJson);
  }

  if (fs.existsSync(paths.configFile)) {
    const configToml = fs.readFileSync(paths.configFile, 'utf8');
    writeText(paths.configFile, stripExistingMcpBlock(configToml).trim());
  }

  uninstallSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: options.skillRoot,
    skillName: 'claude-mem',
  });
  uninstallSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: options.skillRoot,
    sourceSkillName: 'claude-mem',
    targetSkillName: 'codex-mem',
  });

  return { removed: true };
}

async function main() {
  await uninstallCodexAdapter();
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] codex uninstall error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  cleanupHooks,
  uninstallCodexAdapter,
};
