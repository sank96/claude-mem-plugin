'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  readJson,
  writeJson,
} = require('../shared/file-utils.js');
const { uninstallSharedSkill } = require('../shared/skill-utils.js');
const { removeInstalledVersion } = require('../../core/installer-state.js');
const { resolveClaudePaths } = require('./install.js');

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

async function uninstallClaudeAdapter(options = {}) {
  const paths = resolveClaudePaths({
    ...options,
    claudeHome: options.claudeHome ?? path.join(os.homedir(), '.claude'),
  });

  if (fs.existsSync(paths.settingsFile)) {
    const settingsJson = readJson(paths.settingsFile, {});
    settingsJson.hooks = cleanupHooks(settingsJson.hooks ?? {});
    writeJson(paths.settingsFile, settingsJson);
  }

  uninstallSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: options.skillRoot ?? paths.skillRoot,
    skillName: 'claude-mem',
  });
  removeInstalledVersion(paths.claudeHome);

  return { removed: true };
}

async function main() {
  await uninstallClaudeAdapter();
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] claude uninstall error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  cleanupHooks,
  uninstallClaudeAdapter,
};
