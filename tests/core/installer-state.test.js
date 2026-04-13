'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  captureSnapshot,
  readInstalledVersion,
  removeInstalledVersion,
  resolveInstallAction,
  restoreSnapshot,
  writeInstalledVersion,
} = require('../../core/installer-state.js');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanupTempDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

test('readInstalledVersion returns null when adapter home is absent', () => {
  const adapterHome = path.join(os.tmpdir(), `missing-${Date.now()}-${Math.random()}`);
  assert.equal(readInstalledVersion(adapterHome), null);
});

test('writeInstalledVersion writes a marker that readInstalledVersion returns', () => {
  const tempDir = makeTempDir('installer-state-read-write-');

  try {
    writeInstalledVersion(tempDir, '0.1.4');

    const markerPath = path.join(tempDir, 'claude-mem-plugin-meta.json');
    assert.equal(readInstalledVersion(tempDir), '0.1.4');
    assert.deepEqual(JSON.parse(fs.readFileSync(markerPath, 'utf8')), { version: '0.1.4' });
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('removeInstalledVersion is a no-op when the marker is absent', () => {
  const tempDir = makeTempDir('installer-state-remove-');

  try {
    assert.doesNotThrow(() => removeInstalledVersion(tempDir));
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('removeInstalledVersion removes the marker file when present', () => {
  const tempDir = makeTempDir('installer-state-remove-');

  try {
    writeInstalledVersion(tempDir, '0.1.4');
    removeInstalledVersion(tempDir);

    assert.equal(readInstalledVersion(tempDir), null);
    assert.equal(
      fs.existsSync(path.join(tempDir, 'claude-mem-plugin-meta.json')),
      false
    );
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('resolveInstallAction returns install when marker is absent', () => {
  const tempDir = makeTempDir('installer-state-action-');

  try {
    assert.deepEqual(resolveInstallAction(tempDir, '0.1.4'), {
      action: 'install',
      installedVersion: null,
    });
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('resolveInstallAction returns update when marker version differs', () => {
  const tempDir = makeTempDir('installer-state-action-');

  try {
    writeInstalledVersion(tempDir, '0.1.3');

    assert.deepEqual(resolveInstallAction(tempDir, '0.1.4'), {
      action: 'update',
      installedVersion: '0.1.3',
    });
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('resolveInstallAction returns skip when marker version matches', () => {
  const tempDir = makeTempDir('installer-state-action-');

  try {
    writeInstalledVersion(tempDir, '0.1.4');

    assert.deepEqual(resolveInstallAction(tempDir, '0.1.4'), {
      action: 'skip',
      installedVersion: '0.1.4',
    });
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('captureSnapshot stores Buffer for files, Map for directories, and null for absent paths', () => {
  const tempDir = makeTempDir('installer-state-snapshot-');

  try {
    const configFile = path.join(tempDir, 'config.json');
    const skillDir = path.join(tempDir, 'skills', 'claude-mem');
    const missingFile = path.join(tempDir, 'missing.txt');

    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(configFile, '{"ok":true}\n', 'utf8');
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Skill\n', 'utf8');

    const snapshot = captureSnapshot([configFile, skillDir, missingFile]);

    assert.ok(Buffer.isBuffer(snapshot.get(configFile)));
    assert.equal(snapshot.get(configFile).toString('utf8'), '{"ok":true}\n');
    assert.ok(snapshot.get(skillDir) instanceof Map);
    assert.equal(snapshot.get(skillDir).get('SKILL.md').toString('utf8'), '# Skill\n');
    assert.equal(snapshot.get(missingFile), null);
  } finally {
    cleanupTempDir(tempDir);
  }
});

test('restoreSnapshot rewrites files, restores directories, and removes newly created paths', () => {
  const tempDir = makeTempDir('installer-state-restore-');

  try {
    const configFile = path.join(tempDir, 'config.json');
    const skillDir = path.join(tempDir, 'skills', 'claude-mem');
    const generatedPath = path.join(tempDir, 'generated');

    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(configFile, '{"before":true}\n', 'utf8');
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Skill\n', 'utf8');

    const snapshot = captureSnapshot([configFile, skillDir, generatedPath]);

    fs.writeFileSync(configFile, '{"after":true}\n', 'utf8');
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Corrupted\n', 'utf8');
    fs.writeFileSync(path.join(skillDir, 'EXTRA.md'), 'extra\n', 'utf8');
    fs.mkdirSync(generatedPath, { recursive: true });
    fs.writeFileSync(path.join(generatedPath, 'temp.txt'), 'temporary\n', 'utf8');

    restoreSnapshot(snapshot);

    assert.equal(fs.readFileSync(configFile, 'utf8'), '{"before":true}\n');
    assert.equal(fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8'), '# Skill\n');
    assert.equal(fs.existsSync(path.join(skillDir, 'EXTRA.md')), false);
    assert.equal(fs.existsSync(generatedPath), false);
  } finally {
    cleanupTempDir(tempDir);
  }
});
