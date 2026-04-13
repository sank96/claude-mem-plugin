#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PACKAGE_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

node -e "(async () => { const { sessionStartCommand } = require(process.argv[1]); let input = ''; process.stdin.setEncoding('utf8'); for await (const chunk of process.stdin) input += chunk; const payload = input ? JSON.parse(input) : {}; const result = await sessionStartCommand('copilot', payload); process.stdout.write(JSON.stringify(result ?? { continue: true })); })().catch((error) => { process.stderr.write(\`[copilot-mem] session-start error: \${error.message}\\n\`); process.exit(0); });" "$PACKAGE_ROOT/commands/session-start.js"
