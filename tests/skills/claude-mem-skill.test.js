const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('shared skill frontmatter uses claude-mem name', () => {
  const skillPath = path.join(__dirname, '..', '..', 'skills', 'claude-mem', 'SKILL.md');
  const src = fs.readFileSync(skillPath, 'utf8');
  assert.match(src, /^---\s+name: claude-mem/m);
});
