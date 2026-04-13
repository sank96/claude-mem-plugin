'use strict';

const { formatBatchSummary, runBatch } = require('./install-all.js');
const { uninstallCodexAdapter } = require('./codex/uninstall.js');
const { uninstallClaudeAdapter } = require('./claude/uninstall.js');
const { uninstallCopilotAdapter } = require('./copilot/uninstall.js');

async function uninstallAllAdapters(options = {}) {
  const results = await runBatch([
    {
      adapter: 'codex',
      run: uninstallCodexAdapter,
      options: options.codex ?? {},
    },
    {
      adapter: 'claude',
      run: uninstallClaudeAdapter,
      options: options.claude ?? {},
    },
    {
      adapter: 'copilot',
      run: uninstallCopilotAdapter,
      options: options.copilot ?? {},
    },
  ]);

  return {
    ok: results.every((entry) => entry.ok),
    results,
    summary: formatBatchSummary('uninstall', results),
  };
}

async function main() {
  const result = await uninstallAllAdapters();
  process.stdout.write(`${result.summary}\n`);
  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] uninstall-all error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  uninstallAllAdapters,
};
