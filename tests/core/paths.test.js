const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('resolveClaudeMemPaths prefers legacy CLAUDE_PLUGIN_ROOT when it exists', () => {
  const { resolveClaudeMemPaths } = require('../../core/paths.js');
  const originalLegacyRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-home-'));
  const legacyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-legacy-'));

  fs.mkdirSync(path.join(legacyRoot, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(legacyRoot, 'scripts', 'worker-service.cjs'), '');

  process.env.CLAUDE_PLUGIN_ROOT = legacyRoot;

  try {
    const paths = resolveClaudeMemPaths({ homeDir });

    assert.equal(paths.pluginRoot, legacyRoot);
    assert.equal(paths.workerService, path.join(legacyRoot, 'scripts', 'worker-service.cjs'));
  } finally {
    if (originalLegacyRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalLegacyRoot;
    }

    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(legacyRoot, { recursive: true, force: true });
  }
});

test('resolveClaudeMemPaths discovers an installed root from searchRoots', () => {
  const { resolveClaudeMemPaths } = require('../../core/paths.js');
  const originalLegacyRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-home-'));
  const searchBase = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-search-'));
  const discoveredRoot = path.join(
    searchBase,
    '.claude',
    'plugins',
    'marketplaces',
    'thedotmack',
    'plugin'
  );

  fs.mkdirSync(path.join(discoveredRoot, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(discoveredRoot, 'scripts', 'worker-service.cjs'), '');
  delete process.env.CLAUDE_PLUGIN_ROOT;

  try {
    const paths = resolveClaudeMemPaths({ homeDir, searchRoots: [searchBase] });

    assert.equal(paths.pluginRoot, discoveredRoot);
    assert.equal(
      paths.workerService,
      path.join(discoveredRoot, 'scripts', 'worker-service.cjs')
    );
  } finally {
    if (originalLegacyRoot === undefined) {
      delete process.env.CLAUDE_PLUGIN_ROOT;
    } else {
      process.env.CLAUDE_PLUGIN_ROOT = originalLegacyRoot;
    }

    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(searchBase, { recursive: true, force: true });
  }
});
