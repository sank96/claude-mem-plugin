'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  formatDoctorReport,
  probeAdapter,
  resolveProbeTargets,
} = require('../../cli/doctor.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-doctor-'));
}

test('resolveProbeTargets returns the expected default file layout', () => {
  const homeDir = makeTempDir();
  const targets = resolveProbeTargets({
    homeDir,
    pluginRoot: path.join(homeDir, 'upstream'),
    platform: 'darwin',
  });

  assert.equal(targets.upstream.pluginRoot, path.join(homeDir, 'upstream'));
  assert.equal(targets.codex.configFile, path.join(homeDir, '.codex', 'config.toml'));
  assert.equal(targets.codex.hooksFile, path.join(homeDir, '.codex', 'hooks.json'));
  assert.equal(targets.codex.skillDir, path.join(homeDir, '.agents', 'skills', 'claude-mem'));
  assert.equal(targets.claude.configFile, path.join(homeDir, '.claude', 'settings.json'));
  assert.equal(targets.copilot.configFile, path.join(homeDir, '.copilot', 'mcp-config.json'));
});

test('probeAdapter ignores hooksFile when it is undefined', () => {
  const tempDir = makeTempDir();
  const configFile = path.join(tempDir, 'mcp-config.json');
  const skillDir = path.join(tempDir, 'skills', 'claude-mem');

  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(configFile, '{}\n', 'utf8');

  const result = probeAdapter('copilot', { configFile, skillDir });

  assert.equal(result.installed, true);
  assert.deepEqual(result.missing, []);
});

test('probeAdapter reports missing artefacts when config or skill are absent', () => {
  const tempDir = makeTempDir();
  const result = probeAdapter('claude', {
    configFile: path.join(tempDir, 'settings.json'),
    skillDir: path.join(tempDir, 'skills', 'claude-mem'),
  });

  assert.equal(result.installed, false);
  assert.deepEqual(result.missing, ['config', 'skill']);
});

test('formatDoctorReport prints marker version without using it as install truth', () => {
  const report = formatDoctorReport({
    upstream: { ok: true, pluginRoot: '/tmp/plugin' },
    adapters: [
      { adapter: 'claude', installed: true, version: '0.1.4', missing: [] },
      { adapter: 'copilot', installed: false, version: null, missing: ['config', 'skill'] },
    ],
  });

  assert.match(report, /upstream claude-mem: OK/i);
  assert.match(report, /\[claude\]\s+v0\.1\.4\s+→ installed/i);
  assert.match(report, /\[copilot\]\s+—\s+→ NOT INSTALLED/i);
});
