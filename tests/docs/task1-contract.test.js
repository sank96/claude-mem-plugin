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
  assert.match(readme, /Codex/i);
  assert.match(readme, /Claude/i);
  assert.match(readme, /Copilot/i);
  assert.match(readme, /hook-driven/i);
  assert.match(readme, /agent-driven fallback/i);
  assert.match(readme, /upgrade/i);
  assert.match(readme, /uninstall/i);
  assert.match(readme, /troubleshooting/i);
});

test('execution status schema exposes dashboard fields', () => {
  const status = JSON.parse(read('docs/execution-status.json'));
  assert.equal(typeof status.lastUpdated, 'string');
  assert.equal(typeof status.reviewPhase, 'string');
  assert.ok(status.taskBoard && typeof status.taskBoard === 'object');
  assert.ok(Array.isArray(status.taskBoard.planned));
  assert.ok(Array.isArray(status.taskBoard.current));
  assert.ok(Array.isArray(status.taskBoard.completed));
  assert.ok(Array.isArray(status.activeWorkers));
  assert.ok(status.activeTask && typeof status.activeTask === 'object');
  assert.ok(status.queueSummary && typeof status.queueSummary === 'object');
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
});

test('dashboard renders a UI and polls the status source', () => {
  const dashboard = read('docs/dashboard.html');
  assert.match(dashboard, /execution-status\.json/);
  assert.match(dashboard, /setInterval\(refresh,\s*15000\)/);
  assert.match(dashboard, /Active Workers/i);
  assert.match(dashboard, /Review Phase/i);
  assert.match(dashboard, /Queue Summary/i);
  assert.match(dashboard, /Recent Commits/i);
  assert.match(dashboard, /Task Board/i);
  assert.match(dashboard, /Planned Tasks/i);
  assert.match(dashboard, /Current Tasks/i);
  assert.match(dashboard, /Completed Tasks/i);
  assert.match(dashboard, /Assigned to/i);
  assert.match(dashboard, /status-badge/i);
});
