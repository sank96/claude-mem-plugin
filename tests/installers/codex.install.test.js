const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readInstalledVersion, writeInstalledVersion } = require('../../core/installer-state.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-install-'));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFakeUpstream(tempDir, options = {}) {
  const pluginRoot = path.join(tempDir, 'upstream');
  const scriptsDir = path.join(pluginRoot, 'scripts');
  const bunRunner = path.join(scriptsDir, 'bun-runner.js');
  const workerService = path.join(scriptsDir, 'worker-service.cjs');
  const mcpServer = path.join(scriptsDir, 'mcp-server.cjs');
  const workerText = options.workerText ?? "module.exports = { providers: ['codex'] };\n";

  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(bunRunner, '// fake bun runner\n', 'utf8');
  fs.writeFileSync(workerService, workerText, 'utf8');
  fs.writeFileSync(mcpServer, '// fake mcp server\n', 'utf8');

  return {
    pluginRoot,
    bunRunner,
    workerService,
    mcpServer,
  };
}

test('codex installer selects agent-driven mode on windows', () => {
  const { summarizeInstallMode } = require('../../installers/shared/summary.js');
  assert.match(
    summarizeInstallMode({ adapter: 'codex', platform: 'win32' }),
    /agent-driven fallback/i
  );
});

test('codex installer configures hooks on hook-driven platforms', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  const { installCodexAdapter } = require('../../installers/codex/install.js');
  const result = await installCodexAdapter({
    platform: 'darwin',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
  });

  assert.equal(result.runtimeMode, 'hook-driven');

  const hooksFile = path.join(codexHome, 'hooks.json');
  const hooksJson = readJson(hooksFile);
  assert.ok(Array.isArray(hooksJson.hooks.SessionStart));
  assert.ok(Array.isArray(hooksJson.hooks.PostToolUse));
  assert.ok(Array.isArray(hooksJson.hooks.Stop));
  assert.ok(Array.isArray(hooksJson.hooks.SessionEnd));

  const hookEntry = hooksJson.hooks.SessionStart[0];
  assert.match(JSON.stringify(hookEntry), /claude-mem-plugin/i);
  assert.match(JSON.stringify(hookEntry), /session-start\.js/i);

  const configFile = path.join(codexHome, 'config.toml');
  const configToml = fs.readFileSync(configFile, 'utf8');
  assert.match(configToml, /\[mcp_servers\.claude-mem\]/i);
  assert.match(configToml, /mcp-server\.cjs/i);

  const installedSkill = path.join(skillRoot, 'claude-mem', 'SKILL.md');
  assert.equal(fs.existsSync(installedSkill), true);
  const installedCompatibilitySkill = path.join(skillRoot, 'codex-mem');
  assert.equal(fs.existsSync(installedCompatibilitySkill), false);
});

test('codex installer skips hooks on windows fallback mode', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  const { installCodexAdapter } = require('../../installers/codex/install.js');
  const result = await installCodexAdapter({
    platform: 'win32',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
  });

  assert.equal(result.runtimeMode, 'agent-driven fallback');
  assert.equal(fs.existsSync(path.join(codexHome, 'hooks.json')), false);

  const configToml = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.match(configToml, /\[mcp_servers\.claude-mem\]/i);
});

test('codex installer deduplicates legacy and current mcp blocks while preserving tool settings', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  fs.mkdirSync(codexHome, { recursive: true });
  fs.writeFileSync(
    path.join(codexHome, 'config.toml'),
    [
      '# codex-mem MCP server',
      '[mcp_servers.claude-mem]',
      'command = "node"',
      'args = ["C:/legacy/mcp-server.cjs"]',
      '',
      '[mcp_servers.claude-mem.tools.search]',
      'approval_mode = "approve"',
      '',
      '# claude-mem-plugin MCP server',
      '[mcp_servers.claude-mem]',
      'command = "node"',
      'args = ["C:/duplicate/mcp-server.cjs"]',
      '',
    ].join('\n'),
    'utf8'
  );

  const { installCodexAdapter } = require('../../installers/codex/install.js');
  await installCodexAdapter({
    platform: 'win32',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
  });

  const configToml = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.equal((configToml.match(/\[mcp_servers\.claude-mem\]/g) ?? []).length, 1);
  assert.match(configToml, /\[mcp_servers\.claude-mem\.tools\.search\]/i);
  assert.match(configToml, /mcp-server\.cjs/i);
  assert.doesNotMatch(configToml, /C:\/duplicate\/mcp-server\.cjs/i);
});

test('codex installer restores the parent mcp block before orphaned tool tables', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  fs.mkdirSync(codexHome, { recursive: true });
  fs.writeFileSync(
    path.join(codexHome, 'config.toml'),
    [
      'approval_policy = "on-request"',
      '',
      '[mcp_servers.claude-mem.tools.search]',
      'approval_mode = "approve"',
      '',
      '[mcp_servers.claude-mem.tools.timeline]',
      'approval_mode = "approve"',
      '',
    ].join('\n'),
    'utf8'
  );

  const { installCodexAdapter } = require('../../installers/codex/install.js');
  await installCodexAdapter({
    platform: 'win32',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
  });

  const configToml = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.equal((configToml.match(/\[mcp_servers\.claude-mem\]/g) ?? []).length, 1);
  assert.match(configToml, /\[mcp_servers\.claude-mem\.tools\.search\]/i);
  assert.ok(
    configToml.indexOf('[mcp_servers.claude-mem]') <
      configToml.indexOf('[mcp_servers.claude-mem.tools.search]')
  );
});

test('codex installer removes an existing legacy codex-mem alias during reinstall', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  fs.mkdirSync(path.join(skillRoot, 'codex-mem'), { recursive: true });
  fs.writeFileSync(path.join(skillRoot, 'codex-mem', 'SKILL.md'), 'legacy alias\n', 'utf8');

  const { installCodexAdapter } = require('../../installers/codex/install.js');
  await installCodexAdapter({
    platform: 'win32',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
  });

  assert.equal(fs.existsSync(path.join(skillRoot, 'claude-mem', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(skillRoot, 'codex-mem')), false);
});

test('codex uninstall removes hook config, mcp block, and shared skill', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  const { installCodexAdapter } = require('../../installers/codex/install.js');
  const { uninstallCodexAdapter } = require('../../installers/codex/uninstall.js');

  await installCodexAdapter({
    platform: 'darwin',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
  });

  const result = await uninstallCodexAdapter({
    codexHome,
    skillRoot,
  });

  assert.equal(result.removed, true);

  const hooksJson = readJson(path.join(codexHome, 'hooks.json'));
  assert.deepEqual(hooksJson.hooks ?? {}, {});

  const configToml = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.doesNotMatch(configToml, /\[mcp_servers\.claude-mem\]/i);

  assert.equal(fs.existsSync(path.join(skillRoot, 'claude-mem')), false);
  assert.equal(fs.existsSync(path.join(skillRoot, 'codex-mem')), false);
});

test('codex uninstall removes legacy mcp block and nested tool tables', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');

  fs.mkdirSync(codexHome, { recursive: true });
  fs.writeFileSync(
    path.join(codexHome, 'config.toml'),
    [
      'approval_policy = "on-request"',
      '',
      '# codex-mem MCP server',
      '[mcp_servers.claude-mem]',
      'command = "node"',
      'args = ["C:/legacy/mcp-server.cjs"]',
      '',
      '[mcp_servers.claude-mem.tools.search]',
      'approval_mode = "approve"',
      '',
      '[mcp_servers.claude-mem.tools.timeline]',
      'approval_mode = "approve"',
      '',
      '[mcp_servers.other]',
      'command = "node"',
    ].join('\n'),
    'utf8'
  );

  const { uninstallCodexAdapter } = require('../../installers/codex/uninstall.js');
  await uninstallCodexAdapter({
    packageRoot,
    codexHome,
    skillRoot,
  });

  const configToml = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.doesNotMatch(configToml, /\[mcp_servers\.claude-mem\]/i);
  assert.doesNotMatch(configToml, /\[mcp_servers\.claude-mem\.tools\.search\]/i);
  assert.doesNotMatch(configToml, /\[mcp_servers\.claude-mem\.tools\.timeline\]/i);
  assert.match(configToml, /\[mcp_servers\.other\]/i);
});

test('codex installer fails fast when upstream worker lacks codex provider support', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir, {
    workerText: 'module.exports = { providers: [] };\n',
  });

  const { installCodexAdapter } = require('../../installers/codex/install.js');

  await assert.rejects(
    installCodexAdapter({
      platform: 'darwin',
      packageRoot,
      codexHome,
      skillRoot,
      upstreamPaths,
    }),
    /does not yet advertise Codex provider support/i
  );
});

test('codex installer writes the version marker after successful install', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installCodexAdapter } = require('../../installers/codex/install.js');

  const result = await installCodexAdapter({
    platform: 'darwin',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
    version: '0.1.4',
  });

  assert.equal(result.action, 'install');
  assert.equal(readInstalledVersion(codexHome), '0.1.4');
});

test('codex installer skips when the installed version matches', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installCodexAdapter } = require('../../installers/codex/install.js');

  fs.mkdirSync(codexHome, { recursive: true });
  writeInstalledVersion(codexHome, '0.1.4');

  const result = await installCodexAdapter({
    platform: 'darwin',
    packageRoot,
    codexHome,
    skillRoot,
    upstreamPaths,
    version: '0.1.4',
  });

  assert.equal(result.skipped, true);
  assert.equal(result.action, 'skip');
});

test('codex installer rolls back config when shared-skill copy fails', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installCodexAdapter } = require('../../installers/codex/install.js');

  fs.mkdirSync(codexHome, { recursive: true });
  const configFile = path.join(codexHome, 'config.toml');
  const originalConfig = 'approval_policy = "on-request"\n';
  fs.writeFileSync(configFile, originalConfig, 'utf8');

  const skillUtils = {
    uninstallSharedSkill() {},
    installSharedSkill() {
      throw new Error('copy failed');
    },
  };

  await assert.rejects(
    installCodexAdapter({
      platform: 'darwin',
      packageRoot,
      codexHome,
      skillRoot,
      upstreamPaths,
      version: '0.1.4',
      skillUtils,
    }),
    /copy failed/
  );

  assert.equal(fs.readFileSync(configFile, 'utf8'), originalConfig);
  assert.equal(readInstalledVersion(codexHome), null);
});

test('codex uninstall removes the version marker', async () => {
  const tempDir = makeTempDir();
  const codexHome = path.join(tempDir, '.codex');
  const skillRoot = path.join(tempDir, '.agents', 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const { uninstallCodexAdapter } = require('../../installers/codex/uninstall.js');

  fs.mkdirSync(codexHome, { recursive: true });
  writeInstalledVersion(codexHome, '0.1.4');

  await uninstallCodexAdapter({
    packageRoot,
    codexHome,
    skillRoot,
  });

  assert.equal(readInstalledVersion(codexHome), null);
});
