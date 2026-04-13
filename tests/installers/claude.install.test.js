const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-claude-'));
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

  const { installClaudeAdapter } = require('../../installers/claude/install.js');
  const result = await installClaudeAdapter({
    platform: 'darwin',
    packageRoot,
    claudeHome,
    skillRoot,
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

  const { installClaudeAdapter } = require('../../installers/claude/install.js');
  const { uninstallClaudeAdapter } = require('../../installers/claude/uninstall.js');

  await installClaudeAdapter({
    platform: 'darwin',
    packageRoot,
    claudeHome,
    skillRoot,
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
