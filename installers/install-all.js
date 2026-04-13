'use strict';

const { installCodexAdapter } = require('./codex/install.js');
const { installClaudeAdapter } = require('./claude/install.js');
const { installCopilotAdapter } = require('./copilot/install.js');

async function runBatch(steps) {
  const results = [];

  for (const step of steps) {
    try {
      const result = await step.run(step.options ?? {});
      results.push({
        adapter: step.adapter,
        ok: true,
        result,
      });
    } catch (error) {
      results.push({
        adapter: step.adapter,
        ok: false,
        error,
      });
    }
  }

  return results;
}

function formatBatchSummary(action, results) {
  const lines = results.map((entry) => {
    if (entry.ok) {
      const summary = entry.result.summary ?? `${action} completed`;
      return `[${entry.adapter}] OK: ${summary}`;
    }

    return `[${entry.adapter}] ERROR: ${entry.error.message}`;
  });

  const successCount = results.filter((entry) => entry.ok).length;
  lines.push(`${action} all summary: ${successCount}/${results.length} succeeded`);
  return lines.join('\n');
}

async function installAllAdapters(options = {}) {
  const results = await runBatch([
    {
      adapter: 'codex',
      run: installCodexAdapter,
      options: options.codex ?? {},
    },
    {
      adapter: 'claude',
      run: installClaudeAdapter,
      options: options.claude ?? {},
    },
    {
      adapter: 'copilot',
      run: installCopilotAdapter,
      options: options.copilot ?? {},
    },
  ]);

  return {
    ok: results.every((entry) => entry.ok),
    results,
    summary: formatBatchSummary('install', results),
  };
}

async function main() {
  const result = await installAllAdapters();
  process.stdout.write(`${result.summary}\n`);
  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[claude-mem-plugin] install-all error: ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  formatBatchSummary,
  installAllAdapters,
  runBatch,
};
