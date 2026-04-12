const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relPath) {
  const root = path.resolve(__dirname, '..', '..');
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('README covers operator essentials for all CLIs', () => {
  const readme = read('README.md');
  assert.match(readme, /Planned for Task 5/i);
  assert.match(readme, /Planned package layout/i);
  assert.match(readme, /hook-driven/i);
  assert.match(readme, /agent-driven fallback/i);
  assert.match(readme, /upgrade/i);
  assert.match(readme, /uninstall/i);
  assert.match(readme, /troubleshooting/i);
  assert.doesNotMatch(readme, /install:codex/i);
  assert.doesNotMatch(readme, /install:claude/i);
  assert.doesNotMatch(readme, /install:copilot/i);
});

test('installation docs do not advertise runnable installers yet', () => {
  const installation = read('docs/installation.md');
  assert.match(installation, /planned for Task 5/i);
  assert.doesNotMatch(installation, /npm run install:codex/i);
  assert.doesNotMatch(installation, /npm run install:claude/i);
  assert.doesNotMatch(installation, /npm run install:copilot/i);
});

test('execution status schema exposes dashboard fields', () => {
  const status = JSON.parse(read('docs/execution-status.json'));
  assert.equal(typeof status.lastUpdated, 'string');
  assert.equal(typeof status.reviewPhase, 'string');
  assert.ok(status.taskBoard && typeof status.taskBoard === 'object');
  assert.ok(Array.isArray(status.taskBoard.planned));
  assert.ok(Array.isArray(status.taskBoard.current));
  assert.ok(Array.isArray(status.taskBoard.completed));
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
  assert.match(dashboard, /#status-file \{/);
  assert.match(dashboard, /done by/i);
  assert.match(dashboard, /in progress by/i);
  assert.match(dashboard, /nickname/i);
  assert.match(dashboard, /agent type/i);
  assert.match(dashboard, /responsibility/i);
  assert.doesNotMatch(dashboard, /grid-template-columns:\s*repeat\(4/i);
  assert.match(dashboard, /FileReader/i);
  assert.match(dashboard, /status-badge/i);
  assert.doesNotMatch(dashboard, /summary::after \{ content: "âˆ’"; \}/);
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
