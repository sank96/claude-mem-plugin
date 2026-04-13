'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-copilot-install-'));
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
  const mcpServer = path.join(tempDir, 'upstream', 'scripts', 'mcp-server.cjs');

  fs.mkdirSync(path.dirname(mcpServer), { recursive: true });
  fs.writeFileSync(mcpServer, '// fake mcp server\n', 'utf8');

  const { installCopilotAdapter } = require('../../installers/copilot/install.js');
  const { uninstallCopilotAdapter } = require('../../installers/copilot/uninstall.js');

  const result = await installCopilotAdapter({
    platform: 'darwin',
    packageRoot,
    copilotHome,
    upstreamPaths: { mcpServer },
  });

  assert.equal(result.runtimeMode, 'hook-driven');
  assert.equal(result.skillRoot, skillRoot);

  const configFile = path.join(copilotHome, 'mcp-config.json');
  const configJson = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  assert.equal(configJson.mcpServers['claude-mem'].command, 'node');
  assert.equal(
    configJson.mcpServers['claude-mem'].args[0].replace(/\\/g, '/'),
    mcpServer.replace(/\\/g, '/')
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
