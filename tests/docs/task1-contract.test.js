const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relPath) {
  const root = path.resolve(__dirname, '..', '..');
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('README covers operator essentials and current installer availability', () => {
  const readme = read('README.md');
  assert.match(readme, /github\.com\/thedotmack\/claude-mem/i);
  assert.match(readme, /docs\.claude-mem\.ai/i);
  assert.match(readme, /docs\/assets\/claude-mem-plugin-wordmark\.svg/i);
  assert.match(readme, /Shared memory across[\s\S]*Codex[\s\S]*Claude Code[\s\S]*Copilot CLI/i);
  assert.match(readme, /same memory workflow follows you across tools without setup drift/i);
  assert.match(readme, /One public install surface\. One shared skill\. One canonical integration path\./i);
  assert.match(readme, /npx claude-mem-plugin install all/i);
  assert.match(readme, /npx claude-mem-plugin uninstall all/i);
  assert.match(readme, /npx claude-mem-plugin install codex/i);
  assert.match(readme, /npx claude-mem-plugin install claude/i);
  assert.match(readme, /npx claude-mem-plugin install copilot/i);
  assert.match(readme, /At a Glance/i);
  assert.match(readme, /Quick Start/i);
  assert.match(readme, /Why Use It/i);
  assert.match(readme, /What This Is/i);
  assert.match(readme, /What This Is Not/i);
  assert.match(readme, /package and CLI name: `claude-mem-plugin`/i);
  assert.match(readme, /Codex/i);
  assert.match(readme, /Claude/i);
  assert.match(readme, /Copilot/i);
  assert.match(readme, /Verification/i);
  assert.match(readme, /hook-driven/i);
  assert.match(readme, /agent-driven fallback/i);
  assert.match(readme, /uninstall/i);
  assert.match(readme, /Release Model/i);
  assert.match(readme, /docs\/releasing\.md/i);
  assert.match(readme, /docs\/npm-and-npx\.md/i);
  assert.match(readme, /docs\/from-source\.md/i);
  assert.match(readme, /npm install -g claude-mem-plugin/i);
  assert.doesNotMatch(readme, /download the latest `\.zip`/i);
});

test('installation docs advertise public install surfaces for all CLIs', () => {
  const installation = read('docs/installation.md');
  assert.match(installation, /npx claude-mem-plugin install all/i);
  assert.match(installation, /npx claude-mem-plugin uninstall all/i);
  assert.match(installation, /npx claude-mem-plugin install codex/i);
  assert.match(installation, /npx claude-mem-plugin install claude/i);
  assert.match(installation, /npx claude-mem-plugin install copilot/i);
  assert.match(installation, /npx claude-mem-plugin doctor/i);
  assert.match(installation, /npm install -g claude-mem-plugin/i);
  assert.match(installation, /Codex/i);
  assert.match(installation, /Claude/i);
  assert.match(installation, /Copilot/i);
  assert.match(installation, /Upgrading/i);
  assert.match(installation, /Partial failures/i);
  assert.match(installation, /from-source\.md/i);
});

test('README and support docs are explicit about doctor and Copilot runtime truth', () => {
  const readme = read('README.md');
  const supportMatrix = read('docs/support-matrix.md');

  assert.match(readme, /claude-mem-plugin doctor/i);
  assert.match(readme, /Copilot CLI uses `agent-driven fallback` on all platforms/i);
  assert.match(supportMatrix, /agent-driven fallback/i);
  assert.doesNotMatch(supportMatrix, /hook-driven policy/i);
});

test('execution status schema exposes dashboard fields', () => {
  const status = JSON.parse(read('docs/execution-status.json'));
  assert.equal(typeof status.lastUpdated, 'string');
  assert.equal(typeof status.reviewPhase, 'string');
  assert.ok(status.taskBoard && typeof status.taskBoard === 'object');
  assert.ok(Array.isArray(status.taskBoard.planned));
  assert.ok(Array.isArray(status.taskBoard.current));
  assert.ok(Array.isArray(status.taskBoard.completed));
  assert.ok(status.taskBoard.completed.some((task) => task.id === 'task-5'));
  assert.ok(status.taskBoard.completed.some((task) => task.id === 'task-6'));
  assert.ok(status.taskBoard.completed.some((task) => task.id === 'task-7'));
  assert.ok(status.taskBoard.completed.some((task) => task.id === 'task-8'));
  assert.ok(status.taskBoard.completed.some((task) => task.id === 'task-9'));
  assert.equal(status.taskBoard.current.length, 0);
  assert.equal(status.taskBoard.planned.length, 0);
  assert.ok(Array.isArray(status.spawnedAgents));
  assert.equal(status.activeWorkers, undefined);
  assert.ok(Array.isArray(status.blockers));
  assert.ok(Array.isArray(status.recentCommits));
  for (const task of [...status.taskBoard.planned, ...status.taskBoard.current, ...status.taskBoard.completed]) {
    assert.equal(typeof task.id, 'string');
    assert.equal(typeof task.title, 'string');
    assert.equal(typeof task.status, 'string');
    assert.equal(typeof task.assignedTo, 'string');
    assert.equal(typeof task.summary, 'string');
    assert.equal(typeof task.lastUpdated, 'string');
  }
  for (const agent of status.spawnedAgents) {
    assert.equal(typeof agent.nickname, 'string');
    assert.equal(typeof agent.agentType, 'string');
    assert.equal(typeof agent.model, 'string');
    assert.equal(typeof agent.context, 'string');
    assert.equal(typeof agent.responsibility, 'string');
    assert.equal(typeof agent.runtimeStatus, 'string');
  }
});

test('dashboard renders a simplified task board and polls with fallback', () => {
  const dashboard = read('docs/dashboard.html');
  assert.match(dashboard, /execution-status\.json/);
  assert.match(dashboard, /setInterval\(refresh,\s*15000\)/);
  assert.match(dashboard, /Load local JSON/i);
  assert.match(dashboard, /Showing embedded starter snapshot/i);
  assert.match(dashboard, /Task board/i);
  assert.match(dashboard, /Spawned agents/i);
  assert.match(dashboard, /Review queue/i);
  assert.match(dashboard, /Recent commits/i);
  assert.match(dashboard, /Blockers/i);
  assert.match(dashboard, /<details class="card"/i);
  assert.match(dashboard, /<summary>/i);
  assert.match(dashboard, /details\[open\] summary::after \{ content: "-"; \}/);
  assert.match(dashboard, /#status-file \{/i);
  assert.match(dashboard, /done by/i);
  assert.match(dashboard, /in progress by/i);
  assert.match(dashboard, /nickname/i);
  assert.match(dashboard, /agent type/i);
  assert.match(dashboard, /responsibility/i);
  assert.doesNotMatch(dashboard, /grid-template-columns:\s*repeat\(4/i);
  assert.match(dashboard, /FileReader/i);
  assert.match(dashboard, /status-badge/i);
  assert.match(dashboard, /Migration complete; legacy codex-mem removed/i);
  assert.doesNotMatch(dashboard, /Task 1 doc and dashboard repair/i);
  assert.doesNotMatch(dashboard, /summary::after \{ content: "Ã¢Ë†â€™"; \}/);
  assert.doesNotMatch(dashboard, /\.button input \{/);
});

test('execution status markdown stays thin and points to canonical state', () => {
  const statusMd = read('docs/execution-status.md');
  assert.match(statusMd, /thin human-readable pointer/i);
  assert.match(statusMd, /execution-status\.json/i);
  assert.match(statusMd, /dashboard\.html/i);
  assert.doesNotMatch(statusMd, /Current phase/i);
  assert.doesNotMatch(statusMd, /Task board:/i);
});

test('troubleshooting documents file-picker fallback honesty', () => {
  const troubleshooting = read('docs/troubleshooting.md');
  assert.match(troubleshooting, /file picker/i);
  assert.match(troubleshooting, /starter snapshot/i);
  assert.match(troubleshooting, /taskBoard/i);
  assert.match(troubleshooting, /spawnedAgents/i);
  assert.doesNotMatch(troubleshooting, /activeWorkers/i);
});
