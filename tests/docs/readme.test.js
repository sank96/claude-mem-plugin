const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relPath) {
  const root = path.resolve(__dirname, '..', '..');
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('README presents the public distribution and install surface clearly', () => {
  const readme = read('README.md');
  assert.match(readme, /github\.com\/thedotmack\/claude-mem/i);
  assert.match(readme, /docs\.claude-mem\.ai/i);
  assert.match(readme, /img\.shields\.io/i);
  assert.match(readme, /github\/actions\/workflow\/status\/sank96\/claude-mem-plugin\/ci\.yml/i);
  assert.match(readme, /github\.com\/sank96\/claude-mem-plugin\/releases/i);
  assert.match(readme, /GitHub Releases/i);
  assert.match(readme, /npm run install:all/i);
  assert.match(readme, /npm run uninstall:all/i);
  assert.match(readme, /npm run install:codex/i);
  assert.match(readme, /npm run install:claude/i);
  assert.match(readme, /npm run install:copilot/i);
  assert.match(readme, /Support Matrix/i);
  assert.match(readme, /Available/i);
  assert.match(readme, /Table of Contents/i);
  assert.match(readme, /Quick Start/i);
  assert.match(readme, /Runtime Modes/i);
  assert.match(readme, /GitHub release playbook/i);
  assert.match(readme, /Future npm and npx release plan/i);
  assert.match(readme, /npm install` is not required before running the installer scripts/i);
});

test('release operations docs exist and describe GitHub and npm release paths', () => {
  const releasing = read('docs/releasing.md');
  const futureNpm = read('docs/future-npm-release.md');

  assert.match(releasing, /GitHub Release Playbook/i);
  assert.match(releasing, /npm run install:all/i);
  assert.match(releasing, /git archive/i);
  assert.match(releasing, /Get-FileHash/i);
  assert.match(releasing, /Releases/i);

  assert.match(futureNpm, /Future npm and npx Release Plan/i);
  assert.match(futureNpm, /npx claude-mem-plugin install codex/i);
  assert.match(futureNpm, /private/i);
  assert.match(futureNpm, /\bbin\b/i);
});

test('execution status marks the migration as complete', () => {
  const status = JSON.parse(read('docs/execution-status.json'));
  assert.match(status.task, /Migration complete; legacy codex-mem removed/i);
  assert.equal(status.taskBoard.current.length, 0);
  assert.equal(status.taskBoard.completed.some((task) => task.id === 'task-9'), true);
  assert.equal(status.taskBoard.planned.length, 0);
});
