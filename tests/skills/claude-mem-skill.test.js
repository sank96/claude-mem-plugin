const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('shared skill frontmatter uses claude-mem name', () => {
  const skillPath = path.join(__dirname, '..', '..', 'skills', 'claude-mem', 'SKILL.md');
  const src = fs.readFileSync(skillPath, 'utf8');
  assert.match(src, /^---\s+name: claude-mem/m);
  assert.match(src, /proactive/i);
  assert.match(src, /3-step workflow/i);
  assert.match(src, /hook-driven/i);
  assert.match(src, /agent-driven fallback/i);
  assert.match(src, /session start/i);
  assert.match(src, /observation/i);
  assert.match(src, /stop/i);
  assert.match(src, /session end/i);
});
