const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
  const installedCompatibilitySkill = path.join(skillRoot, 'codex-mem', 'SKILL.md');
  assert.equal(fs.existsSync(installedCompatibilitySkill), true);
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
