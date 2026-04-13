const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-install-all-'));
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

test('install-all installs all three adapters and reports aggregate success', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installAllAdapters } = require('../../installers/install-all.js');

  const result = await installAllAdapters({
    codex: {
      platform: 'darwin',
      packageRoot,
      codexHome: path.join(tempDir, '.codex'),
      skillRoot: path.join(tempDir, '.agents', 'skills'),
      upstreamPaths,
    },
    claude: {
      platform: 'darwin',
      packageRoot,
      claudeHome: path.join(tempDir, '.claude'),
      skillRoot: path.join(tempDir, '.claude', 'skills'),
    },
    copilot: {
      platform: 'darwin',
      packageRoot,
      copilotHome: path.join(tempDir, '.copilot'),
      skillRoot: path.join(tempDir, '.copilot', 'skills'),
      upstreamPaths,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.results.length, 3);
  assert.match(result.summary, /\[codex\] OK:/i);
  assert.match(result.summary, /\[claude\] OK:/i);
  assert.match(result.summary, /\[copilot\] OK:/i);
  assert.match(result.summary, /install all summary: 3\/3 succeeded/i);
  assert.equal(fs.existsSync(path.join(tempDir, '.codex', 'config.toml')), true);
  assert.equal(fs.existsSync(path.join(tempDir, '.claude', 'settings.json')), true);
  assert.equal(fs.existsSync(path.join(tempDir, '.copilot', 'mcp-config.json')), true);
});

test('install-all continues after one adapter fails and reports aggregate failure', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir, {
    workerText: 'module.exports = { providers: [] };\n',
  });
  const { installAllAdapters } = require('../../installers/install-all.js');

  const result = await installAllAdapters({
    codex: {
      platform: 'darwin',
      packageRoot,
      codexHome: path.join(tempDir, '.codex'),
      skillRoot: path.join(tempDir, '.agents', 'skills'),
      upstreamPaths,
    },
    claude: {
      platform: 'darwin',
      packageRoot,
      claudeHome: path.join(tempDir, '.claude'),
      skillRoot: path.join(tempDir, '.claude', 'skills'),
    },
    copilot: {
      platform: 'darwin',
      packageRoot,
      copilotHome: path.join(tempDir, '.copilot'),
      skillRoot: path.join(tempDir, '.copilot', 'skills'),
      upstreamPaths,
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.summary, /\[codex\] ERROR:/i);
  assert.match(result.summary, /\[claude\] OK:/i);
  assert.match(result.summary, /\[copilot\] OK:/i);
  assert.match(result.summary, /install all summary: 2\/3 succeeded/i);
  assert.equal(fs.existsSync(path.join(tempDir, '.claude', 'settings.json')), true);
  assert.equal(fs.existsSync(path.join(tempDir, '.copilot', 'mcp-config.json')), true);
});

test('uninstall-all removes all three adapters and reports aggregate success', async () => {
  const tempDir = makeTempDir();
  const packageRoot = path.join(__dirname, '..', '..');
  const upstreamPaths = writeFakeUpstream(tempDir);
  const { installAllAdapters } = require('../../installers/install-all.js');
  const { uninstallAllAdapters } = require('../../installers/uninstall-all.js');

  await installAllAdapters({
    codex: {
      platform: 'darwin',
      packageRoot,
      codexHome: path.join(tempDir, '.codex'),
      skillRoot: path.join(tempDir, '.agents', 'skills'),
      upstreamPaths,
    },
    claude: {
      platform: 'darwin',
      packageRoot,
      claudeHome: path.join(tempDir, '.claude'),
      skillRoot: path.join(tempDir, '.claude', 'skills'),
    },
    copilot: {
      platform: 'darwin',
      packageRoot,
      copilotHome: path.join(tempDir, '.copilot'),
      skillRoot: path.join(tempDir, '.copilot', 'skills'),
      upstreamPaths,
    },
  });

  const result = await uninstallAllAdapters({
    codex: {
      packageRoot,
      codexHome: path.join(tempDir, '.codex'),
      skillRoot: path.join(tempDir, '.agents', 'skills'),
      upstreamPaths,
    },
    claude: {
      packageRoot,
      claudeHome: path.join(tempDir, '.claude'),
      skillRoot: path.join(tempDir, '.claude', 'skills'),
    },
    copilot: {
      packageRoot,
      copilotHome: path.join(tempDir, '.copilot'),
      skillRoot: path.join(tempDir, '.copilot', 'skills'),
      upstreamPaths,
    },
  });

  assert.equal(result.ok, true);
  assert.match(result.summary, /uninstall all summary: 3\/3 succeeded/i);
  assert.equal(fs.existsSync(path.join(tempDir, '.agents', 'skills', 'claude-mem')), false);
  assert.equal(fs.existsSync(path.join(tempDir, '.agents', 'skills', 'codex-mem')), false);
  assert.equal(fs.existsSync(path.join(tempDir, '.claude', 'skills', 'claude-mem')), false);
  assert.equal(fs.existsSync(path.join(tempDir, '.copilot', 'skills', 'claude-mem')), false);
});
