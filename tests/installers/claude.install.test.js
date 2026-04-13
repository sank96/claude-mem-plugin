const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readInstalledVersion, writeInstalledVersion } = require('../../core/installer-state.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-claude-'));
}

function writeFakeUpstream(tempDir) {
  const pluginRoot = path.join(tempDir, 'upstream');
  const scriptsDir = path.join(pluginRoot, 'scripts');
  const bunRunner = path.join(scriptsDir, 'bun-runner.js');
  const workerService = path.join(scriptsDir, 'worker-service.cjs');

  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(bunRunner, '// fake bun runner\n', 'utf8');
  fs.writeFileSync(workerService, '// fake worker\n', 'utf8');

  return {
    pluginRoot,
    bunRunner,
    workerService,
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('claude session-end hook command passes only the lifecycle payload', () => {
  const { buildClaudeHooksConfig } = require('../../installers/claude/install.js');
  const hooksConfig = buildClaudeHooksConfig(path.join(__dirname, '..', '..'));
  const command = hooksConfig.SessionEnd[0].hooks[0].command;

  assert.match(command, /sessionEndCommand\(payload\)/);
  assert.doesNotMatch(command, /sessionEndCommand\("claude", payload\)/);
  assert.doesNotMatch(command, /\(,\s*payload\)/);
});

test('claude installer configures hooks and installs the shared skill on hook-driven platforms', async () => {
  const tempDir = makeTempDir();
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  const { installClaudeAdapter } = require('../../installers/claude/install.js');
  const result = await installClaudeAdapter({
    platform: 'darwin',
    packageRoot,
    claudeHome,
    skillRoot,
    upstreamPaths,
  });

  assert.equal(result.runtimeMode, 'hook-driven');

  const settingsFile = path.join(claudeHome, 'settings.json');
  const settingsJson = readJson(settingsFile);

  assert.ok(Array.isArray(settingsJson.hooks.SessionStart));
  assert.ok(Array.isArray(settingsJson.hooks.PostToolUse));
  assert.ok(Array.isArray(settingsJson.hooks.Stop));
  assert.ok(Array.isArray(settingsJson.hooks.SessionEnd));
  assert.match(JSON.stringify(settingsJson.hooks), /claude-mem-plugin/i);

  const installedSkill = path.join(skillRoot, 'claude-mem', 'SKILL.md');
  assert.equal(fs.existsSync(installedSkill), true);
});

test('claude uninstall removes hook config and the shared skill', async () => {
  const tempDir = makeTempDir();
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);

  const { installClaudeAdapter } = require('../../installers/claude/install.js');
  const { uninstallClaudeAdapter } = require('../../installers/claude/uninstall.js');

  await installClaudeAdapter({
    platform: 'darwin',
    packageRoot,
    claudeHome,
    skillRoot,
    upstreamPaths,
  });

  const result = await uninstallClaudeAdapter({
    claudeHome,
    skillRoot,
  });

  assert.equal(result.removed, true);

  const settingsFile = path.join(claudeHome, 'settings.json');
  const settingsJson = readJson(settingsFile);
  assert.deepEqual(settingsJson.hooks ?? {}, {});

  const installedSkill = path.join(skillRoot, 'claude-mem');
  assert.equal(fs.existsSync(installedSkill), false);
});

test('resolveClaudePaths surfaces upstream plugin files', () => {
  const tempDir = makeTempDir();
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { resolveClaudePaths } = require('../../installers/claude/install.js');

  const paths = resolveClaudePaths({
    claudeHome: path.join(tempDir, '.claude'),
    upstreamPaths,
  });

  assert.equal(paths.pluginRoot, upstreamPaths.pluginRoot);
  assert.equal(paths.bunRunner, upstreamPaths.bunRunner);
  assert.equal(paths.workerService, upstreamPaths.workerService);
});

test('claude installer fails fast when upstream worker files are missing', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const { installClaudeAdapter } = require('../../installers/claude/install.js');

  await assert.rejects(
    installClaudeAdapter({
      platform: 'darwin',
      packageRoot,
      claudeHome,
      skillRoot,
      upstreamPaths: {},
    }),
    /required upstream file/i
  );
});

test('claude installer writes the version marker after successful install', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installClaudeAdapter } = require('../../installers/claude/install.js');

  const result = await installClaudeAdapter({
    platform: 'darwin',
    packageRoot,
    claudeHome,
    skillRoot,
    upstreamPaths,
    version: '0.1.4',
  });

  assert.equal(result.action, 'install');
  assert.equal(readInstalledVersion(claudeHome), '0.1.4');
});

test('claude installer skips when marker version matches', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installClaudeAdapter } = require('../../installers/claude/install.js');

  fs.mkdirSync(claudeHome, { recursive: true });
  writeInstalledVersion(claudeHome, '0.1.4');

  const result = await installClaudeAdapter({
    platform: 'darwin',
    packageRoot,
    claudeHome,
    skillRoot,
    upstreamPaths,
    version: '0.1.4',
  });

  assert.equal(result.action, 'skip');
  assert.equal(result.skipped, true);
});

test('claude installer rolls back settings when shared-skill copy fails', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const settingsFile = path.join(claudeHome, 'settings.json');
  const { installClaudeAdapter } = require('../../installers/claude/install.js');

  fs.mkdirSync(claudeHome, { recursive: true });
  const originalSettings = '{\n  "existing": true\n}\n';
  fs.writeFileSync(settingsFile, originalSettings, 'utf8');

  const skillUtils = {
    installSharedSkill() {
      throw new Error('copy failed');
    },
  };

  await assert.rejects(
    installClaudeAdapter({
      platform: 'darwin',
      packageRoot,
      claudeHome,
      skillRoot,
      upstreamPaths,
      version: '0.1.4',
      skillUtils,
    }),
    /copy failed/
  );

  assert.equal(fs.readFileSync(settingsFile, 'utf8'), originalSettings);
  assert.equal(readInstalledVersion(claudeHome), null);
});

test('claude uninstall removes the version marker', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const claudeHome = path.join(tempDir, '.claude');
  const skillRoot = path.join(claudeHome, 'skills');
  const { uninstallClaudeAdapter } = require('../../installers/claude/uninstall.js');

  fs.mkdirSync(claudeHome, { recursive: true });
  writeInstalledVersion(claudeHome, '0.1.4');

  await uninstallClaudeAdapter({
    packageRoot,
    claudeHome,
    skillRoot,
  });

  assert.equal(readInstalledVersion(claudeHome), null);
});
