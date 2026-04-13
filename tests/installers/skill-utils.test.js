'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-mem-plugin-skill-utils-'));
}

function createDirectoryLink(targetDir, linkDir) {
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(targetDir, linkDir, linkType);
}

test('installSharedSkill copies the shared skill when the target does not exist', () => {
  const tempDir = makeTempDir();
  const skillRoot = path.join(tempDir, 'skills');
  const packageRoot = path.join(__dirname, '..', '..');
  const { installSharedSkill } = require('../../installers/shared/skill-utils.js');

  const result = installSharedSkill({
    packageRoot,
    skillRoot,
    skillName: 'claude-mem',
  });

  assert.equal(result.preservedExistingLink, false);
  assert.equal(fs.existsSync(path.join(skillRoot, 'claude-mem', 'SKILL.md')), true);
});

test('installSharedSkill preserves an existing linked skill directory', () => {
  const tempDir = makeTempDir();
  const skillRoot = path.join(tempDir, 'skills');
  const managedRoot = path.join(tempDir, 'managed', 'claude-mem');
  const packageRoot = path.join(__dirname, '..', '..');
  const { installSharedSkill } = require('../../installers/shared/skill-utils.js');

  fs.mkdirSync(managedRoot, { recursive: true });
  fs.writeFileSync(path.join(managedRoot, 'SKILL.md'), 'managed source\n', 'utf8');
  fs.mkdirSync(skillRoot, { recursive: true });
  createDirectoryLink(managedRoot, path.join(skillRoot, 'claude-mem'));

  const result = installSharedSkill({
    packageRoot,
    skillRoot,
    skillName: 'claude-mem',
  });

  assert.equal(result.preservedExistingLink, true);
  const stats = fs.lstatSync(path.join(skillRoot, 'claude-mem'));
  assert.equal(stats.isSymbolicLink(), true);
  assert.equal(
    fs.readFileSync(path.join(skillRoot, 'claude-mem', 'SKILL.md'), 'utf8'),
    'managed source\n'
  );
});
