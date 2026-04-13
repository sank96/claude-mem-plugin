'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const provider = require('../../adapters/codex/provider.js');
const { resolveClaudeMemPaths } = require('../../core/paths.js');
const { selectRuntimePolicy } = require('../../core/runtime-policy.js');
const {
  ensureDir,
  readJson,
  writeJson,
  writeText,
} = require('../shared/file-utils.js');
const { installSharedSkill, uninstallSharedSkill } = require('../shared/skill-utils.js');
const { normalizeRuntimeMode, summarizeInstallMode } = require('../shared/summary.js');

const MCP_BLOCK_MARKER = '# claude-mem-plugin MCP server';
const LEGACY_CODEX_SKILL_NAME = 'codex-mem';

function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function buildHookCommand(scriptPath) {
  return `node "${normalizeFilePath(scriptPath)}"`;
}

function resolveCodexPaths(options = {}) {
  const packageRoot = options.packageRoot ?? path.resolve(__dirname, '..', '..');
  const codexHome = options.codexHome ?? path.join(os.homedir(), '.codex');
  const upstreamPaths = options.upstreamPaths ?? resolveClaudeMemPaths(options);

  return {
    packageRoot,
    codexHome,
    hooksFile: path.join(codexHome, 'hooks.json'),
    configFile: path.join(codexHome, 'config.toml'),
    adapterRoot: path.join(packageRoot, 'adapters', 'codex'),
    pluginRoot: upstreamPaths.pluginRoot,
    bunRunner: upstreamPaths.bunRunner,
    workerService: upstreamPaths.workerService,
    mcpServer: upstreamPaths.mcpServer,
  };
}

function validateCodexInstallPrereqs(paths) {
  if (!fs.existsSync(paths.pluginRoot)) {
    throw new Error(
      `claude-mem not found at ${paths.pluginRoot}. Install the upstream plugin first.`
    );
  }

  for (const requiredFile of [paths.bunRunner, paths.workerService, paths.mcpServer]) {
    if (!fs.existsSync(requiredFile)) {
      throw new Error(`required upstream file is missing: ${requiredFile}`);
    }
  }

  const workerSrc = fs.readFileSync(paths.workerService, 'utf8');
  if (!workerSrc.includes('"codex"') && !workerSrc.includes("'codex'")) {
    throw new Error(
      'worker-service.cjs does not yet advertise Codex provider support. ' +
      'Update the upstream claude-mem plugin before installing the Codex adapter.'
    );
  }
}

function buildCodexHooksConfig(adapterRoot) {
  const hooksRoot = path.join(adapterRoot, 'hooks');
  const sessionStart = path.join(hooksRoot, path.basename(provider.hooks.sessionStart));
  const postToolUse = path.join(hooksRoot, path.basename(provider.hooks.postToolUse));
  const stop = path.join(hooksRoot, path.basename(provider.hooks.stop));
  const sessionEnd = path.join(hooksRoot, path.basename(provider.hooks.sessionEnd));

  return {
    SessionStart: [
      {
        matcher: 'startup|clear',
        hooks: [
          {
            type: 'command',
            command: buildHookCommand(sessionStart),
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
            command: buildHookCommand(postToolUse),
            timeout: 120,
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            type: 'command',
            command: buildHookCommand(stop),
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
            command: buildHookCommand(sessionEnd),
            timeout: 5,
          },
        ],
      },
    ],
  };
}

function buildCodexMcpBlock(mcpServerPath) {
  return [
    '',
    MCP_BLOCK_MARKER,
    '[mcp_servers.claude-mem]',
    'command = "node"',
    `args = ["${normalizeFilePath(mcpServerPath)}"]`,
    '',
  ].join('\n');
}

function isClaudeMemNestedTable(line) {
  return typeof line === 'string' && /^\[mcp_servers\.claude-mem\./.test(line);
}

function upsertCodexMcpBlock(content, mcpServerPath) {
  const lines = content.split(/\r?\n/);
  const nextLines = [];
  let sawPrimaryBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isMarker =
      line === '# claude-mem-plugin MCP server' ||
      line === '# codex-mem MCP server';
    const tableLine = isMarker ? lines[index + 1] : line;

    if (tableLine === '[mcp_servers.claude-mem]') {
      if (isMarker) {
        index += 1;
      }

      while (index + 1 < lines.length && !lines[index + 1].startsWith('[')) {
        index += 1;
      }

      if (!sawPrimaryBlock) {
        nextLines.push(...buildCodexMcpBlock(mcpServerPath).trim().split('\n'));
        sawPrimaryBlock = true;
      }

      continue;
    }

    if (isMarker && isClaudeMemNestedTable(tableLine)) {
      if (!sawPrimaryBlock) {
        nextLines.push(...buildCodexMcpBlock(mcpServerPath).trim().split('\n'));
        sawPrimaryBlock = true;
      }

      continue;
    }

    if (!sawPrimaryBlock && isClaudeMemNestedTable(line)) {
      nextLines.push(...buildCodexMcpBlock(mcpServerPath).trim().split('\n'));
      sawPrimaryBlock = true;
    }

    nextLines.push(line);
  }

  if (!sawPrimaryBlock) {
    const trimmed = nextLines.join('\n').trimEnd();
    return `${trimmed}${buildCodexMcpBlock(mcpServerPath)}`;
  }

  return `${nextLines.join('\n').trimEnd()}\n`;
}

function removeCodexMcpBlock(content) {
  const lines = content.split(/\r?\n/);
  const nextLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isMarker =
      line === '# claude-mem-plugin MCP server' ||
      line === '# codex-mem MCP server';
    const sectionLine = isMarker ? lines[index + 1] : line;

    if (
      typeof sectionLine === 'string' &&
      /^\[mcp_servers\.claude-mem(?:[.\]].*)?$/.test(sectionLine)
    ) {
      if (isMarker) {
        index += 1;
      }

      while (index + 1 < lines.length && !lines[index + 1].startsWith('[')) {
        index += 1;
      }

      continue;
    }

    nextLines.push(line);
  }

  return `${nextLines.join('\n').trim()}\n`;
}

function mergeHooks(existingHooks, adapterRoot) {
  const nextHooks = { ...existingHooks };
  const claudeMemHooks = buildCodexHooksConfig(adapterRoot);

  for (const [event, entries] of Object.entries(claudeMemHooks)) {
    const currentEntries = Array.isArray(nextHooks[event]) ? nextHooks[event] : [];
    nextHooks[event] = [
      ...currentEntries.filter((entry) => !JSON.stringify(entry).includes('claude-mem-plugin')),
      ...entries,
    ];
  }

  return nextHooks;
}

async function installCodexAdapter(options = {}) {
  const paths = resolveCodexPaths(options);
  const runtimePolicy = selectRuntimePolicy({
    adapter: provider.adapter,
    platform: options.platform,
  });
  const runtimeMode = normalizeRuntimeMode(runtimePolicy);

  validateCodexInstallPrereqs(paths);
  ensureDir(paths.codexHome);

  if (runtimePolicy === 'hook-driven') {
    const hooksJson = readJson(paths.hooksFile, {});
    hooksJson.hooks = mergeHooks(hooksJson.hooks ?? {}, paths.adapterRoot);
    writeJson(paths.hooksFile, hooksJson);
  }

  const configToml = fs.existsSync(paths.configFile)
    ? fs.readFileSync(paths.configFile, 'utf8')
    : '';
  const nextConfig = upsertCodexMcpBlock(configToml, paths.mcpServer);
  writeText(paths.configFile, nextConfig);

  uninstallSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: options.skillRoot,
    sourceSkillName: 'claude-mem',
    targetSkillName: LEGACY_CODEX_SKILL_NAME,
  });

  const skillPaths = installSharedSkill({
    packageRoot: paths.packageRoot,
    skillRoot: options.skillRoot,
    skillName: 'claude-mem',
  });

  return {
    codexHome: paths.codexHome,
    hooksFile: paths.hooksFile,
    configFile: paths.configFile,
    mcpServer: paths.mcpServer,
    runtimeMode,
    skillDir: skillPaths.targetDir,
    summary: summarizeInstallMode({
      adapter: provider.adapter,
      platform: options.platform,
    }),
  };
}

async function main() {
  const result = await installCodexAdapter();
  process.stdout.write(`${result.summary}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] codex install error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  MCP_BLOCK_MARKER,
  buildCodexHooksConfig,
  buildCodexMcpBlock,
  installCodexAdapter,
  LEGACY_CODEX_SKILL_NAME,
  isClaudeMemNestedTable,
  normalizeFilePath,
  removeCodexMcpBlock,
  resolveCodexPaths,
  upsertCodexMcpBlock,
  validateCodexInstallPrereqs,
};
