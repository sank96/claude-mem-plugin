$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$packageRoot = Resolve-Path (Join-Path $scriptDir '..\..\..')
$modulePath = Join-Path $packageRoot 'commands\session-start.js'
$nodeScript = @'
(async () => {
  const { sessionStartCommand } = require(process.argv[1]);
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  const payload = input ? JSON.parse(input) : {};
  const result = await sessionStartCommand('copilot', payload);
  process.stdout.write(JSON.stringify(result ?? { continue: true }));
})().catch((error) => {
  process.stderr.write(`[copilot-mem] session-start error: ${error.message}\n`);
  process.exit(0);
});
'@

$inputText = [Console]::In.ReadToEnd()
$inputText | node -e $nodeScript $modulePath
