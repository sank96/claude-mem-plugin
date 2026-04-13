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
  assert.match(readme, /npx-ready/i);
  assert.match(readme, /docs\/assets\/claude-mem-plugin-wordmark\.svg/i);
  assert.match(readme, /Shared memory across[\s\S]*Codex[\s\S]*Claude Code[\s\S]*Copilot CLI/i);
  assert.match(readme, /same memory workflow follows you across tools without setup drift/i);
  assert.match(readme, /One public install surface\. One shared skill\. One canonical integration path\./i);
  assert.match(readme, /npx claude-mem-plugin install codex/i);
  assert.match(readme, /npx claude-mem-plugin install all/i);
  assert.match(readme, /npx claude-mem-plugin uninstall all/i);
  assert.match(readme, /At a Glance/i);
  assert.match(readme, /Support Matrix/i);
  assert.match(readme, /Available/i);
  assert.match(readme, /Quick Start/i);
  assert.match(readme, /Why Use It/i);
  assert.match(readme, /What This Is/i);
  assert.match(readme, /What This Is Not/i);
  assert.match(readme, /Runtime Modes/i);
  assert.match(readme, /GitHub release playbook/i);
  assert.match(readme, /npm and npx distribution status/i);
  assert.match(readme, /npm install -g claude-mem-plugin/i);
  assert.match(readme, /package and CLI name: `claude-mem-plugin`/i);
  assert.match(readme, /docs\/from-source\.md/i);
  assert.match(readme, /docs\/superpowers\/specs\/2026-04-13-readme-positioning-design\.md/i);
  assert.match(readme, /docs\/superpowers\/specs\/2026-04-13-wordmark-design\.md/i);
  assert.doesNotMatch(readme, /download the latest `\.zip`/i);
  assert.doesNotMatch(readme, /clone the repository/i);
});

test('release operations docs exist and describe GitHub and npm release paths', () => {
  const releasing = read('docs/releasing.md');
  const futureNpm = read('docs/npm-and-npx.md');

  assert.match(releasing, /GitHub Release Playbook/i);
  assert.match(releasing, /npm run install:all/i);
  assert.match(releasing, /npm exec --yes --package/i);
  assert.match(releasing, /npm pack/i);
  assert.match(releasing, /git archive/i);
  assert.match(releasing, /Get-FileHash/i);
  assert.match(releasing, /Releases/i);

  assert.match(futureNpm, /npm and npx Distribution Status/i);
  assert.match(futureNpm, /npx claude-mem-plugin install codex/i);
  assert.match(futureNpm, /npm install -g claude-mem-plugin/i);
  assert.match(futureNpm, /published npm tarball/i);
  assert.match(futureNpm, /\bbin\b/i);
});

test('execution status marks the migration as complete', () => {
  const status = JSON.parse(read('docs/execution-status.json'));
  assert.match(status.task, /Migration complete; legacy codex-mem removed/i);
  assert.equal(status.taskBoard.current.length, 0);
  assert.equal(status.taskBoard.completed.some((task) => task.id === 'task-9'), true);
  assert.equal(status.taskBoard.planned.length, 0);
});
