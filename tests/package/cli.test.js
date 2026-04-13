const test = require('node:test');
const assert = require('node:assert/strict');

function createIo() {
  return {
    stdout: {
      buffer: '',
      write(chunk) {
        this.buffer += chunk;
      },
    },
    stderr: {
      buffer: '',
      write(chunk) {
        this.buffer += chunk;
      },
    },
  };
}

test('parseArgs recognizes help, version, and install commands', () => {
  const { parseArgs } = require('../../cli/index.js');

  assert.deepEqual(parseArgs([]), { kind: 'help' });
  assert.deepEqual(parseArgs(['--help']), { kind: 'help' });
  assert.deepEqual(parseArgs(['--version']), { kind: 'version' });
  assert.deepEqual(parseArgs(['install', 'codex']), {
    kind: 'command',
    command: 'install',
    target: 'codex',
  });
});

test('runCli prints help when no arguments are passed', async () => {
  const { runCli } = require('../../cli/index.js');
  const io = createIo();

  const exitCode = await runCli([], { version: '0.1.0', install: {}, uninstall: {} }, io);

  assert.equal(exitCode, 0);
  assert.match(io.stdout.buffer, /Usage:/i);
});

test('runCli dispatches install all and returns success', async () => {
  const { runCli } = require('../../cli/index.js');
  const io = createIo();
  let called = false;

  const exitCode = await runCli(
    ['install', 'all'],
    {
      version: '0.1.0',
      install: {
        all: async () => {
          called = true;
          return { ok: true, summary: 'install all summary: 3/3 succeeded' };
        },
      },
      uninstall: {},
    },
    io
  );

  assert.equal(exitCode, 0);
  assert.equal(called, true);
  assert.match(io.stdout.buffer, /3\/3 succeeded/i);
});

test('runCli returns non-zero when handler reports aggregate failure', async () => {
  const { runCli } = require('../../cli/index.js');
  const io = createIo();

  const exitCode = await runCli(
    ['install', 'all'],
    {
      version: '0.1.0',
      install: {
        all: async () => ({ ok: false, summary: 'install all summary: 2/3 succeeded' }),
      },
      uninstall: {},
    },
    io
  );

  assert.equal(exitCode, 1);
  assert.match(io.stdout.buffer, /2\/3 succeeded/i);
});

test('runCli returns non-zero on invalid commands', async () => {
  const { runCli } = require('../../cli/index.js');
  const io = createIo();

  const exitCode = await runCli(['destroy'], { version: '0.1.0', install: {}, uninstall: {} }, io);

  assert.equal(exitCode, 1);
  assert.match(io.stderr.buffer, /unknown command/i);
});
