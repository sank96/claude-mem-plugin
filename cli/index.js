'use strict';

const { installAllAdapters } = require('../installers/install-all.js');
const { uninstallAllAdapters } = require('../installers/uninstall-all.js');
const { installCodexAdapter } = require('../installers/codex/install.js');
const { uninstallCodexAdapter } = require('../installers/codex/uninstall.js');
const { installClaudeAdapter } = require('../installers/claude/install.js');
const { uninstallClaudeAdapter } = require('../installers/claude/uninstall.js');
const { installCopilotAdapter } = require('../installers/copilot/install.js');
const { uninstallCopilotAdapter } = require('../installers/copilot/uninstall.js');
const { runDoctor } = require('./doctor.js');

function usage() {
  return [
    'claude-mem-plugin',
    '',
    'Usage:',
    '  claude-mem-plugin install <codex|claude|copilot|all>',
    '  claude-mem-plugin uninstall <codex|claude|copilot|all>',
    '  claude-mem-plugin doctor',
    '  claude-mem-plugin help',
    '  claude-mem-plugin --help',
    '  claude-mem-plugin --version',
  ].join('\n');
}

function parseArgs(argv) {
  const [command, target] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    return { kind: 'help' };
  }

  if (command === '--version' || command === '-v') {
    return { kind: 'version' };
  }

  if (command === 'doctor') {
    return { kind: 'doctor' };
  }

  if (!['install', 'uninstall'].includes(command)) {
    return { kind: 'error', message: `unknown command: ${command}` };
  }

  if (!target) {
    return { kind: 'error', message: `missing target for ${command}` };
  }

  if (!['codex', 'claude', 'copilot', 'all'].includes(target)) {
    return { kind: 'error', message: `unknown target for ${command}: ${target}` };
  }

  return { kind: 'command', command, target };
}

function createDefaultDeps() {
  return {
    version: require('../package.json').version,
    doctor: runDoctor,
    install: {
      codex: installCodexAdapter,
      claude: installClaudeAdapter,
      copilot: installCopilotAdapter,
      all: installAllAdapters,
    },
    uninstall: {
      codex: uninstallCodexAdapter,
      claude: uninstallClaudeAdapter,
      copilot: uninstallCopilotAdapter,
      all: uninstallAllAdapters,
    },
  };
}

async function runCli(argv, deps = createDefaultDeps(), io = process) {
  const parsed = parseArgs(argv);

  if (parsed.kind === 'help') {
    io.stdout.write(`${usage()}\n`);
    return 0;
  }

  if (parsed.kind === 'version') {
    io.stdout.write(`${deps.version}\n`);
    return 0;
  }

  if (parsed.kind === 'error') {
    io.stderr.write(`[claude-mem-plugin] ${parsed.message}\n`);
    io.stderr.write(`${usage()}\n`);
    return 1;
  }

  if (parsed.kind === 'doctor') {
    try {
      const result = await deps.doctor();
      if (result && result.summary) {
        io.stdout.write(`${result.summary}\n`);
      }
      return result && result.ok === false ? 1 : 0;
    } catch (error) {
      io.stderr.write(`[claude-mem-plugin] doctor error: ${error.message}\n`);
      return 1;
    }
  }

  try {
    const handler = deps[parsed.command][parsed.target];
    const result = await handler();
    if (result && result.summary) {
      io.stdout.write(`${result.summary}\n`);
    }
    return result && result.ok === false ? 1 : 0;
  } catch (error) {
    io.stderr.write(
      `[claude-mem-plugin] ${parsed.command} ${parsed.target} error: ${error.message}\n`
    );
    return 1;
  }
}

module.exports = {
  createDefaultDeps,
  parseArgs,
  runCli,
  usage,
};
