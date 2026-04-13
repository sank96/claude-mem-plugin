# Troubleshooting

- Verify Node.js 18 or newer is installed.
- Confirm commands are run from the `claude-mem-plugin/` repository root.
- If Codex on Windows does not create `.codex/hooks.json`, that is expected because Windows stays on `agent-driven fallback`.
- If Codex on macOS does not create hooks, rerun `npm run install:codex` and inspect `.codex/hooks.json`.
- If Claude does not create hook entries, rerun `npm run install:claude` and inspect `.claude/settings.json`.
- If Copilot does not resolve the MCP server, rerun `npm run install:copilot` and inspect `.copilot/mcp-config.json`.
- If hooks are unreliable, use the agent-driven fallback workflow.
- If you open `docs/dashboard.html` with `file://`, use the file picker to load the current local `execution-status.json` instead of relying on the embedded starter snapshot.
- If the UI renders no tasks or agents, verify that the JSON schema still includes `taskBoard`, `spawnedAgents`, `activeTask`, and `queueSummary`.
- If the CLI installer reports the wrong mode, check the platform policy for the current adapter before changing code.
