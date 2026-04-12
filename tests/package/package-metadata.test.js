const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('package metadata and docs entrypoints exist', () => {
  const root = path.resolve(__dirname, '..', '..');
  assert.equal(fs.existsSync(path.join(root, 'package.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'README.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'architecture.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'dashboard.html')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'execution-status.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'execution-status.json')), true);
});

test('package metadata is minimally valid', () => {
  const root = path.resolve(__dirname, '..', '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'claude-mem-plugin');
  assert.equal(pkg.private, true);
  assert.equal(pkg.engines.node, '>=18');
  assert.equal(pkg.scripts.test, 'node --test tests/package/package-metadata.test.js tests/docs/task1-contract.test.js');
});
