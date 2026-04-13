'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readInstalledVersion, writeInstalledVersion } = require('../../core/installer-state.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-copilot-install-'));
}

function writeFakeUpstream(tempDir) {
  const pluginRoot = path.join(tempDir, 'upstream');
  const scriptsDir = path.join(pluginRoot, 'scripts');
  const mcpServer = path.join(scriptsDir, 'mcp-server.cjs');

  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(mcpServer, '// fake mcp server\n', 'utf8');

  return {
    pluginRoot,
    mcpServer,
  };
}

test('copilot installer builds an MCP config with node command and claude-mem server', () => {
  const { buildCopilotMcpConfig } = require('../../installers/copilot/install.js');

  const config = buildCopilotMcpConfig('/abs/path/mcp-server.cjs');

  assert.equal(config.mcpServers['claude-mem'].command, 'node');
});

test('copilot installer writes mcp-config and installs the shared skill under .copilot/skills', async () => {
  const tempDir = makeTempDir();
  const copilotHome = path.join(tempDir, '.copilot');
  const packageRoot = path.join(__dirname, '..', '..');
  const skillRoot = path.join(copilotHome, 'skills');
  const upstreamPaths = writeFakeUpstream(tempDir);

  const { installCopilotAdapter } = require('../../installers/copilot/install.js');
  const { uninstallCopilotAdapter } = require('../../installers/copilot/uninstall.js');

  const result = await installCopilotAdapter({
    platform: 'darwin',
    packageRoot,
    copilotHome,
    upstreamPaths,
  });

  assert.equal(result.runtimeMode, 'agent-driven fallback');
  assert.equal(result.skillRoot, skillRoot);

  const configFile = path.join(copilotHome, 'mcp-config.json');
  const configJson = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  assert.equal(configJson.mcpServers['claude-mem'].command, 'node');
  assert.equal(
    configJson.mcpServers['claude-mem'].args[0].replace(/\\/g, '/'),
    upstreamPaths.mcpServer.replace(/\\/g, '/')
  );

  const installedSkill = path.join(skillRoot, 'claude-mem', 'SKILL.md');
  assert.equal(fs.existsSync(installedSkill), true);

  const uninstallResult = await uninstallCopilotAdapter({
    copilotHome,
    packageRoot,
  });

  assert.equal(uninstallResult.removed, true);
  assert.equal(fs.existsSync(installedSkill), false);
  assert.equal(fs.existsSync(configFile), false);
});

test('resolveCopilotPaths surfaces pluginRoot and mcpServer', () => {
  const tempDir = makeTempDir();
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { resolveCopilotPaths } = require('../../installers/copilot/install.js');

  const paths = resolveCopilotPaths({
    copilotHome: path.join(tempDir, '.copilot'),
    upstreamPaths,
  });

  assert.equal(paths.pluginRoot, upstreamPaths.pluginRoot);
  assert.equal(paths.mcpServer, upstreamPaths.mcpServer);
});

test('copilot installer fails fast when pluginRoot or mcpServer is missing', async () => {
  const tempDir = makeTempDir();
  const copilotHome = path.join(tempDir, '.copilot');
  const packageRoot = path.join(__dirname, '..', '..');
  const skillRoot = path.join(copilotHome, 'skills');
  const { installCopilotAdapter } = require('../../installers/copilot/install.js');

  await assert.rejects(
    installCopilotAdapter({
      platform: 'darwin',
      packageRoot,
      copilotHome,
      skillRoot,
      upstreamPaths: {},
    }),
    /required upstream file/i
  );
});

test('copilot installer writes the version marker after successful install', async () => {
  const tempDir = makeTempDir();
  const copilotHome = path.join(tempDir, '.copilot');
  const packageRoot = path.join(__dirname, '..', '..');
  const skillRoot = path.join(copilotHome, 'skills');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installCopilotAdapter } = require('../../installers/copilot/install.js');

  const result = await installCopilotAdapter({
    platform: 'darwin',
    packageRoot,
    copilotHome,
    skillRoot,
    upstreamPaths,
    version: '0.1.4',
  });

  assert.equal(result.action, 'install');
  assert.equal(readInstalledVersion(copilotHome), '0.1.4');
});

test('copilot installer skips when marker version matches', async () => {
  const tempDir = makeTempDir();
  const copilotHome = path.join(tempDir, '.copilot');
  const packageRoot = path.join(__dirname, '..', '..');
  const skillRoot = path.join(copilotHome, 'skills');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installCopilotAdapter } = require('../../installers/copilot/install.js');

  fs.mkdirSync(copilotHome, { recursive: true });
  writeInstalledVersion(copilotHome, '0.1.4');

  const result = await installCopilotAdapter({
    platform: 'darwin',
    packageRoot,
    copilotHome,
    skillRoot,
    upstreamPaths,
    version: '0.1.4',
  });

  assert.equal(result.action, 'skip');
  assert.equal(result.skipped, true);
});

test('copilot installer rolls back config when shared-skill copy fails', async () => {
  const tempDir = makeTempDir();
  const copilotHome = path.join(tempDir, '.copilot');
  const packageRoot = path.join(__dirname, '..', '..');
  const skillRoot = path.join(copilotHome, 'skills');
  const configFile = path.join(copilotHome, 'mcp-config.json');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installCopilotAdapter } = require('../../installers/copilot/install.js');

  fs.mkdirSync(copilotHome, { recursive: true });
  const originalConfig = '{\n  "existing": true\n}\n';
  fs.writeFileSync(configFile, originalConfig, 'utf8');

  const skillUtils = {
    installSharedSkill() {
      throw new Error('copy failed');
    },
  };

  await assert.rejects(
    installCopilotAdapter({
      platform: 'darwin',
      packageRoot,
      copilotHome,
      skillRoot,
      upstreamPaths,
      version: '0.1.4',
      skillUtils,
    }),
    /copy failed/
  );

  assert.equal(fs.readFileSync(configFile, 'utf8'), originalConfig);
  assert.equal(readInstalledVersion(copilotHome), null);
});

test('copilot uninstall removes the version marker', async () => {
  const tempDir = makeTempDir();
  const copilotHome = path.join(tempDir, '.copilot');
  const packageRoot = path.join(__dirname, '..', '..');
  const skillRoot = path.join(copilotHome, 'skills');
  const { uninstallCopilotAdapter } = require('../../installers/copilot/uninstall.js');

  fs.mkdirSync(copilotHome, { recursive: true });
  writeInstalledVersion(copilotHome, '0.1.4');

  await uninstallCopilotAdapter({
    packageRoot,
    copilotHome,
    skillRoot,
  });

  assert.equal(readInstalledVersion(copilotHome), null);
});
