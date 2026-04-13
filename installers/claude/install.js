'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const provider = require('../../adapters/claude/provider.js');
const { resolveClaudeMemPaths } = require('../../core/paths.js');
const sharedFileUtils = require('../shared/file-utils.js');
const sharedSkillUtils = require('../shared/skill-utils.js');
const { normalizeRuntimeMode, summarizeInstallMode } = require('../shared/summary.js');
const { selectRuntimePolicy } = require('../../core/runtime-policy.js');
const {
  captureSnapshot,
  removeInstalledVersion,
  resolveInstallAction,
  restoreSnapshot,
  writeInstalledVersion,
} = require('../../core/installer-state.js');

const SETTINGS_MARKER = '# claude-mem-plugin Claude hooks';

function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function buildNodeHookCommand(
  modulePath,
  exportName,
  providerName,
  { returnsJson = true, fallbackResult = null } = {}
) {
  const fallbackJson = JSON.stringify(fallbackResult);
  const commandArgs = providerName ? `${JSON.stringify(providerName)}, payload` : 'payload';
  const script = [
    "const fs = require('node:fs');",
    `const { ${exportName} } = require(${JSON.stringify(normalizeFilePath(modulePath))});`,
    "const input = fs.readFileSync(0, 'utf8');",
    "const payload = input ? JSON.parse(input) : {};",
    `Promise.resolve(${exportName}(${commandArgs}))`,
    '  .then((result) => {',
    returnsJson
      ? `    process.stdout.write(JSON.stringify(result === undefined ? ${fallbackJson} : result));`
      : '    void result;',
    '  })',
    returnsJson
      ? `  .catch(() => { process.stdout.write(JSON.stringify(${fallbackJson})); });`
      : "  .catch(() => { process.exit(0); });",
  ].join('\n');

  return `node -e ${JSON.stringify(script)}`;
}

function resolveClaudePaths(options = {}) {
  const packageRoot = options.packageRoot ?? path.resolve(__dirname, '..', '..');
  const claudeHome = options.claudeHome ?? path.join(os.homedir(), '.claude');
  const skillRoot = options.skillRoot ?? path.join(claudeHome, 'skills');
  const upstreamPaths = options.upstreamPaths ?? resolveClaudeMemPaths(options);

  return {
    packageRoot,
    claudeHome,
    settingsFile: path.join(claudeHome, 'settings.json'),
    skillRoot,
    pluginRoot: upstreamPaths.pluginRoot,
    bunRunner: upstreamPaths.bunRunner,
    workerService: upstreamPaths.workerService,
  };
}

function validateClaudeInstallPrereqs(paths) {
  for (const requiredPath of [paths.pluginRoot, paths.bunRunner, paths.workerService]) {
    if (!requiredPath || !fs.existsSync(requiredPath)) {
      throw new Error(`required upstream file is missing: ${requiredPath}`);
    }
  }
}

function buildClaudeHooksConfig(packageRoot) {
  const commandsRoot = path.join(packageRoot, 'commands');
  const sessionStart = path.join(commandsRoot, 'session-start.js');
  const observe = path.join(commandsRoot, 'observe.js');
  const stop = path.join(commandsRoot, 'stop.js');
  const sessionEnd = path.join(commandsRoot, 'session-end.js');

  return {
    SessionStart: [
      {
        hooks: [
          {
            type: 'command',
            command: buildNodeHookCommand(sessionStart, 'sessionStartCommand', provider.provider, {
              fallbackResult: { continue: true },
            }),
            timeout: 60,
            statusMessage: 'claude-mem-plugin: loading shared memory context',
          },
        ],
      },
    ],
    PostToolUse: [
      {
        matcher: '*',
        hooks: [
          {
            type: 'command',
            command: buildNodeHookCommand(observe, 'observeCommand', provider.provider, {
              fallbackResult: { continue: true, suppressOutput: true },
            }),
            timeout: 120,
            statusMessage: 'claude-mem-plugin: recording shared memory observation',
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            type: 'command',
            command: buildNodeHookCommand(stop, 'stopCommand', provider.provider, {
              fallbackResult: { continue: true, suppressOutput: true },
            }),
            timeout: 120,
            statusMessage: 'claude-mem-plugin: summarizing shared memory session',
          },
        ],
      },
    ],
    SessionEnd: [
      {
        hooks: [
          {
            type: 'command',
            command: buildNodeHookCommand(sessionEnd, 'sessionEndCommand', null, {
              returnsJson: false,
            }),
            timeout: 5,
          },
        ],
      },
    ],
  };
}

function mergeHooks(existingHooks, packageRoot) {
  const nextHooks = { ...existingHooks };
  const claudeMemHooks = buildClaudeHooksConfig(packageRoot);

  for (const [event, entries] of Object.entries(claudeMemHooks)) {
    const currentEntries = Array.isArray(nextHooks[event]) ? nextHooks[event] : [];
    nextHooks[event] = [
      ...currentEntries.filter((entry) => !JSON.stringify(entry).includes('claude-mem-plugin')),
      ...entries,
    ];
  }

  return nextHooks;
}

async function installClaudeAdapter(options = {}) {
  const deps = {
    fileUtils: options.fileUtils ?? sharedFileUtils,
    skillUtils: options.skillUtils ?? sharedSkillUtils,
  };
  const paths = resolveClaudePaths(options);
  const runtimePolicy = selectRuntimePolicy({
    adapter: provider.adapter,
    platform: options.platform,
  });
  const runtimeMode = normalizeRuntimeMode(runtimePolicy);
  const currentVersion = options.version ?? require('../../package.json').version;
  const installState = resolveInstallAction(paths.claudeHome, currentVersion);
  const canonicalSkillDir = path.join(paths.skillRoot, 'claude-mem');

  if (installState.action === 'skip') {
    return {
      action: installState.action,
      skipped: true,
      claudeHome: paths.claudeHome,
      settingsFile: paths.settingsFile,
      runtimeMode,
      skillDir: canonicalSkillDir,
      skillRoot: paths.skillRoot,
      summary: `skipped (v${installState.installedVersion} already installed)`,
    };
  }

  validateClaudeInstallPrereqs(paths);
  deps.fileUtils.ensureDir(paths.claudeHome);

  const snapshot = captureSnapshot([paths.settingsFile, canonicalSkillDir]);

  try {
    if (runtimePolicy === 'hook-driven') {
      const settingsJson = deps.fileUtils.readJson(paths.settingsFile, {});
      settingsJson.hooks = mergeHooks(settingsJson.hooks ?? {}, paths.packageRoot);
      deps.fileUtils.writeJson(paths.settingsFile, settingsJson);
    }

    const skillPaths = deps.skillUtils.installSharedSkill({
      packageRoot: paths.packageRoot,
      skillRoot: paths.skillRoot,
      skillName: 'claude-mem',
    });

    writeInstalledVersion(paths.claudeHome, currentVersion);

    return {
      action: installState.action,
      skipped: false,
      claudeHome: paths.claudeHome,
      settingsFile: paths.settingsFile,
      runtimeMode,
      skillDir: skillPaths.targetDir,
      skillRoot: skillPaths.skillRoot,
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
  const result = await installClaudeAdapter();
  process.stdout.write(`${result.summary}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] claude install error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  SETTINGS_MARKER,
  buildClaudeHooksConfig,
  buildNodeHookCommand,
  installClaudeAdapter,
  mergeHooks,
  normalizeFilePath,
  resolveClaudePaths,
  validateClaudeInstallPrereqs,
};
